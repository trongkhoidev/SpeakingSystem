"""Azure Speech Service for pronunciation assessment."""

import io
import logging
import json
import asyncio
from typing import Optional, List
from azure.cognitiveservices.speech import (
    SpeechConfig,
    AudioConfig,
    SpeechRecognizer,
    PronunciationAssessmentConfig,
    PronunciationAssessmentGradingSystem,
    PronunciationAssessmentGranularity,
    ResultReason,
)
from app.models.audio import AzurePronunciationResult, PhonemeDetail, WordDetail
from app.core.config import settings

logger = logging.getLogger(__name__)


class AzureService:
    """Service for Azure Speech Pronunciation Assessment."""
    
    def __init__(self):
        self.key = settings.AZURE_SPEECH_KEY
        self.region = settings.AZURE_SPEECH_REGION
    
    async def assess_pronunciation(
        self,
        audio_data: bytes,
        reference_text: str,
        language: str = "en-US"
    ) -> AzurePronunciationResult:
        """
        Assess pronunciation using Azure Speech Service in a non-blocking way.
        """
        
        # Use run_in_executor since speech SDK is synchronous
        return await asyncio.get_event_loop().run_in_executor(
            None,
            self._assess_pronunciation_sync,
            audio_data,
            reference_text,
            language
        )

    def _assess_pronunciation_sync(
        self,
        audio_data: bytes,
        reference_text: str,
        language: str = "en-US"
    ) -> AzurePronunciationResult:
        """
        Synchronous wrapper for Azure SDK call.
        """
        
        try:
            if not self.key:
                raise ValueError("AZURE_SPEECH_KEY not configured")

            speech_config = SpeechConfig(subscription=self.key, region=self.region)
            
            # Use PushAudioInputStream to feed audio data from memory
            from azure.cognitiveservices.speech.audio import PushAudioInputStream, AudioStreamFormat
            
            # Assuming wav data is already coming in as 16kHz mono 16-bit PCM (handled by preprocessor)
            stream_format = AudioStreamFormat(samples_per_second=16000, bits_per_sample=16, channels=1)
            push_stream = PushAudioInputStream(stream_format)
            push_stream.write(audio_data)
            push_stream.close()
            
            audio_config = AudioConfig(stream=push_stream)
            
            # Pronunciation Assessment Config
            pronunciation_config = PronunciationAssessmentConfig(
                reference_text=reference_text,
                grading_system=PronunciationAssessmentGradingSystem.HundredMark,
                granularity=PronunciationAssessmentGranularity.Phoneme,
                enable_prosody=True
            )
            
            recognizer = SpeechRecognizer(speech_config=speech_config, audio_config=audio_config, language=language)
            pronunciation_config.apply_to(recognizer)
            
            # Start assessment
            result = recognizer.recognize_once()
            
            if result.reason == ResultReason.RecognizedSpeech:
                pronunciation_result = json.loads(result.properties.get(
                    ResultReason.RecognizedSpeech.id if hasattr(ResultReason.RecognizedSpeech, 'id') else 1  # Standard is usually 1
                ) or result.properties.get(ResultReason.RecognizedSpeech.__str__()) or "{}")
                
                # Check if it's there as a property
                json_result = result.properties.get(3) # PropertyId.SpeechServiceResponse_JsonResult is often 3
                if json_result:
                    pronunciation_result = json.loads(json_result)

                # More reliable way via PronunciationAssessmentResult object
                from azure.cognitiveservices.speech import PronunciationAssessmentResult
                assessment_result = PronunciationAssessmentResult(result)
                
                phoneme_details = []
                word_details = []
                for word_res in assessment_result.words:
                    word_phonemes = []
                    for ph in getattr(word_res, 'phonemes', []):
                        p_detail = PhonemeDetail(
                            phoneme=ph.phoneme,
                            accuracy_score=ph.accuracy_score,
                            errortype=self._map_error_type(ph.error_type)
                        )
                        word_phonemes.append(p_detail)
                        phoneme_details.append(p_detail)
                    
                    word_details.append(WordDetail(
                        word=word_res.word,
                        accuracy_score=word_res.accuracy_score,
                        error_type=self._map_error_type(word_res.error_type),
                        phonemes=word_phonemes
                    ))
                
                return AzurePronunciationResult(
                    accuracy_score=assessment_result.accuracy_score,
                    fluency_score=assessment_result.fluency_score,
                    prosody_score=assessment_result.prosody_score,
                    pronunciation_score=assessment_result.pronunciation_score,
                    completeness_score=assessment_result.completeness_score,
                    phoneme_details=phoneme_details,
                    words=word_details,
                    raw_response=pronunciation_result
                )
            
            elif result.reason == ResultReason.NoMatch:
                raise RuntimeError("Speech could not be recognized - Check audio quality")
            elif result.reason == ResultReason.Canceled:
                cancellation_details = result.cancellation_details
                raise RuntimeError(f"Azure Pronunciation assessment canceled: {cancellation_details.reason} - {cancellation_details.error_details}")
            else:
                raise RuntimeError(f"Azure assessment failed with reason: {result.reason}")

        except Exception as e:
            logger.error(f"Pronunciation assessment failed: {str(e)}")
            raise RuntimeError(f"Pronunciation assessment failed: {str(e)}")

    def _map_error_type(self, error_type: str) -> Optional[str]:
        """Maps Azure error types to our model."""
        if error_type == "None":
            return None
        return error_type
