"""Assessment orchestration service — runs the full AI pipeline."""

import asyncio
import logging
import json
import uuid
from fastapi import HTTPException
from app.models.assessment import IELTSAssessmentResult, BandScores
from app.services.deepgram_service import DeepgramService
from app.services.azure_service import AzureService
from app.services.llm_service import LLMService
from app.services.scoring_service import ScoringService
from app.services.gatekeeper_service import GatekeeperService
from app.services.audio_preprocessor import AudioPreprocessor
from app.services.blob_service import BlobService
from sqlalchemy.orm import Session
from app.models.sqlalchemy_models import PracticeAnswer
from uuid import UUID

logger = logging.getLogger(__name__)

# Audio validation constants (from requirements edge cases)
MIN_AUDIO_DURATION_SECONDS = 1.0
MAX_AUDIO_DURATION_SECONDS = 600.0  # 10 minutes


class AssessmentService:
    def __init__(self):
        self.deepgram_service = DeepgramService()
        self.azure_service = AzureService()
        self.llm_service = LLMService()
        self.scoring_service = ScoringService()
        self.gatekeeper_service = GatekeeperService()
        self.blob_service = BlobService()

    async def run_assessment_pipeline(
        self,
        audio_data: bytes,
        audio_filename: str,
        question_text: str,
        user_id: str,
        question_id: str,
        session_id: str | None = None,
        db: Session | None = None
    ) -> IELTSAssessmentResult:
        """Runs the full AI pipeline and optionally persists to DB."""
        
        # 0. Audio validation (M12)
        duration = await AudioPreprocessor.get_audio_duration(audio_data)
        if duration < MIN_AUDIO_DURATION_SECONDS:
            raise HTTPException(status_code=400, detail="Recording too short. Please record at least 1 second.")
        if duration > MAX_AUDIO_DURATION_SECONDS:
            raise HTTPException(status_code=400, detail="Recording too long. Maximum is 10 minutes.")

        # 1. Preprocess audio to 16kHz WAV
        processed_audio = AudioPreprocessor.process_to_wav(audio_data)

        # 2. Transcription (needed by all subsequent stages)
        transcription_result = await self.deepgram_service.transcribe(
            audio_data=audio_data,
            audio_format=audio_filename.split('.')[-1].lower() or "webm",
            language="en"
        )
        transcript = transcription_result.transcript
        
        if not transcript or len(transcript.strip()) < 5:
            raise HTTPException(status_code=400, detail="No speech detected. Please try again with clearer audio.")

        # 3. Stage 0 + Stage 1: Run Gatekeeper + Azure IN PARALLEL
        #    Both only need the transcript from Deepgram — no dependency on each other.
        gatekeeper_task = self.gatekeeper_service.check_relevance(
            question_text, transcript
        )
        azure_task = self.azure_service.assess_pronunciation(
            audio_data=processed_audio,
            reference_text=transcript,
            language="en-US"
        )
        
        (is_relevant, relevance_score), azure_result = await asyncio.gather(
            gatekeeper_task,
            azure_task
        )
        
        # 4. Stage 2: LLM analysis (needs Azure brief for context)
        azure_brief = {
            "accuracy": azure_result.accuracy_score,
            "fluency": azure_result.fluency_score,
            "prosody": azure_result.prosody_score,
            "completeness": azure_result.completeness_score
        }
        
        feedback_json = await self.llm_service.analyze_comprehensive_stage2(
            question_text, transcript, azure_brief
        )

        # 5. Scoring
        pron_band = self.scoring_service.calculate_pronunciation_band(
            azure_result.accuracy_score, 
            azure_result.fluency_score, 
            azure_result.prosody_score
        )
        
        band_scores = BandScores(
            FC=feedback_json["FC"]["score"],
            LR=feedback_json["LR"]["score"],
            GRA=feedback_json["GRA"]["score"],
            PRON=pron_band
        )
        
        overall_band = self.scoring_service.calculate_overall_band(band_scores)

        # 6. Color-coded transcript tokens
        colored_tokens = self._generate_color_coded_transcript(azure_result.words)

        # 7. Persistence and Audio Upload
        audio_url = None
        if db:
            # Generate a unique name for the audio file
            audio_name = f"{user_id}/{uuid.uuid4()}.wav"
            uploaded_name = self.blob_service.upload_audio(processed_audio, audio_name)
            audio_url = uploaded_name
            
            answer = PracticeAnswer(
                session_id=session_id,
                question_id=question_id,
                student_transcript=transcript,
                audio_blob_url=uploaded_name,
                duration_seconds=duration,
                azure_result=json.dumps(azure_result.raw_response),
                llm_result=json.dumps(feedback_json),
                accuracy_score=azure_result.accuracy_score,
                fluency_score=azure_result.fluency_score,
                completeness_score=azure_result.completeness_score,
                prosody_score=azure_result.prosody_score,
                fc_band=band_scores.fluency_coherence,
                lr_band=band_scores.lexical_resource,
                gra_band=band_scores.grammatical_accuracy,
                pronunciation_band=band_scores.pronunciation,
                overall_band=overall_band,
                word_details=json.dumps(colored_tokens)
            )
            db.add(answer)
            db.commit()
            db.refresh(answer)

        return IELTSAssessmentResult(
            question_id=UUID(question_id),
            user_id=user_id,
            student_transcript=transcript,
            is_relevant=is_relevant,
            relevance_score=relevance_score,
            azure_pronunciation=azure_result.raw_response,
            feedback_json=feedback_json,
            band_scores=band_scores,
            overall_band=overall_band,
            color_coded_transcript=colored_tokens,
            audio_url=audio_url
        )

    def _generate_color_coded_transcript(self, word_details: list) -> list:
        """Generate color-coded word tokens per design (Green ≥80 / Amber ≥60 / Red <60)."""
        colored_tokens = []
        for wd in word_details:
            score = wd.accuracy_score
            color = "green" if score >= 80 else "amber" if score >= 60 else "red"
            colored_tokens.append({
                "word": wd.word,
                "color": color,
                "accuracy_score": score,
                "error_type": wd.error_type,
                "phonemes": [
                    {
                        "phoneme": ph.phoneme, 
                        "accuracy_score": ph.accuracy_score, 
                        "error_type": ph.errortype
                    } 
                    for ph in wd.phonemes
                ]
            })
        return colored_tokens
