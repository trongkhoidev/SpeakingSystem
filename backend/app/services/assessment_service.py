import logging
from uuid import UUID
from fastapi import UploadFile, HTTPException
from app.models.assessment import IELTSAssessmentResult, BandScores
from app.services.deepgram_service import DeepgramService
from app.services.azure_service import AzureService
from app.services.llm_service import LLMService
from app.services.scoring_service import ScoringService
from app.services.gatekeeper_service import GatekeeperService
from app.services.audio_preprocessor import AudioPreprocessor
from app.services.blob_service import BlobService
from sqlalchemy.orm import Session
from app.models.sqlalchemy_models import Answer
import json
import uuid

logger = logging.getLogger(__name__)

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
        session_id: str = None,
        db: Session = None
    ) -> IELTSAssessmentResult:
        """Runs the 3-stage AI pipeline and optionally persists to DB."""
        
        # 0. Preprocess audio to 16kHz WAV
        processed_audio = AudioPreprocessor.process_to_wav(audio_data)

        # 1. Transcription
        transcription_result = await self.deepgram_service.transcribe(
            audio_data=audio_data,
            audio_format=audio_filename.split('.')[-1].lower() or "webm",
            language="en"
        )
        transcript = transcription_result.transcript
        
        # 2. Stage 0: Gatekeeper
        is_relevant, relevance_score = await self.gatekeeper_service.check_relevance(
            question_text, transcript
        )
        
        # 3. Stage 1: Azure Pronunciation
        azure_result = await self.azure_service.assess_pronunciation(
            audio_data=processed_audio,
            reference_text=transcript,
            language="en-US"
        )

        # 4. Stage 2: Comprehensive LLM
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

        # 6. Formatting tokens
        colored_tokens = self._generate_color_coded_transcript(azure_result.words)

        # 7. Persistence and Audio Upload
        audio_name = None
        if db:
            # Generate a unique name for the audio file
            audio_name = f"{user_id}/{uuid.uuid4()}.wav"
            uploaded_name = self.blob_service.upload_audio(processed_audio, audio_name)
            
            answer = Answer(
                user_id=user_id,
                question_id=question_id,
                session_id=session_id,
                audio_url=uploaded_name,  # Store the blob name/relative path
                transcript=transcript,
                band_fc=band_scores.fluency_coherence,
                band_lr=band_scores.lexical_resource,
                band_gra=band_scores.grammatical_accuracy,
                band_pron=band_scores.pronunciation,
                band_overall=overall_band,
                feedback_json=feedback_json,
                azure_results_json=azure_result.raw_response
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
            color_coded_transcript=colored_tokens
        )

    def _generate_color_coded_transcript(self, word_details: list) -> list:
        colored_tokens = []
        for wd in word_details:
            score = wd.accuracy_score
            color = "green" if score >= 80 else "orange" if score >= 60 else "red"
            colored_tokens.append({
                "word": wd.word,
                "color": color,
                "accuracy": score,
                "error": wd.error_type,
                "phonemes": [{"phoneme": ph.phoneme, "accuracy_score": ph.accuracy_score, "errortype": ph.errortype} for ph in wd.phonemes]
            })
        return colored_tokens
