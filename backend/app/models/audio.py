"""Audio processing data models."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AudioProcessRequest(BaseModel):
    """Request model for audio processing endpoint."""
    
    audio_file: bytes
    user_id: str
    question_id: str
    audio_format: str = "webm"  # webm, wav, m4a
    metadata: Optional[dict] = None


class PhonemeDetail(BaseModel):
    """Azure Phoneme assessment detail."""
    
    phoneme: str
    accuracy_score: float
    errortype: Optional[str] = None  # None, Insertion, Omission, Mispronunciation


class WordDetail(BaseModel):
    """Azure Word assessment detail."""
    
    word: str
    accuracy_score: float
    error_type: Optional[str] = None
    phonemes: List[PhonemeDetail]


class AzurePronunciationResult(BaseModel):
    """Azure Speech Pronunciation Assessment result."""
    
    accuracy_score: float  # 0-100
    fluency_score: float  # 0-100
    prosody_score: float  # 0-100
    pronunciation_score: float  # 0-100 (overall)
    completeness_score: float  # 0-100
    phoneme_details: List[PhonemeDetail]
    words: List[WordDetail] = []
    raw_response: dict  # Store raw Azure response for debugging


class DeepgramTranscriptResponse(BaseModel):
    """Deepgram STT response wrapper."""
    
    transcript: str
    confidence: float
    duration: float  # seconds
    words: List[dict]  # Word-level details if available
    raw_response: dict  # Store raw Deepgram response for debugging
