"""Deepgram STT service for audio transcription."""

import asyncio
import aiohttp
from typing import Optional
from app.models.audio import DeepgramTranscriptResponse
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class DeepgramService:
    """Service for Deepgram Nova-3 transcription."""
    
    BASE_URL = "https://api.deepgram.com/v1/listen"
    
    def __init__(self):
        self.api_key = settings.DEEPGRAM_API_KEY
        self.model = settings.DEEPGRAM_MODEL
    
    async def transcribe(
        self,
        audio_data: bytes,
        audio_format: str = "webm",
        language: str = "en"
    ) -> DeepgramTranscriptResponse:
        """
        Transcribe audio using Deepgram Nova-3.
        
        Args:
            audio_data: Raw audio bytes
            audio_format: Audio format (webm, wav, etc.)
            language: Language code (default: en)
        
        Returns:
            DeepgramTranscriptResponse with transcript and metadata
        
        Raises:
            RuntimeError: If Deepgram API call fails
        """
        
        headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": f"audio/{audio_format}",
        }
        
        params = {
            "model": self.model,
            "language": language,
            "include_word_confidence": "true",
            "punctuation": "true",
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.BASE_URL,
                    headers=headers,
                    params=params,
                    data=audio_data,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Deepgram API error: {error_text}")
                        raise RuntimeError(f"Deepgram error: {response.status}")
                    
                    result = await response.json()
                    
                    # Extract transcript from results
                    transcript = result["results"]["channels"][0]["alternatives"][0]["transcript"]
                    confidence = result["results"]["channels"][0]["alternatives"][0].get("confidence", 0.0)
                    
                    return DeepgramTranscriptResponse(
                        transcript=transcript,
                        confidence=confidence,
                        duration=float(result.get("metadata", {}).get("duration", 0)),
                        words=result["results"]["channels"][0]["alternatives"][0].get("words", []),
                        raw_response=result,
                    )
        
        except asyncio.TimeoutError:
            logger.error("Deepgram request timed out")
            raise RuntimeError("Deepgram transcription timeout")
        except Exception as e:
            logger.error(f"Deepgram transcription failed: {str(e)}")
            raise RuntimeError(f"Transcription failed: {str(e)}")
