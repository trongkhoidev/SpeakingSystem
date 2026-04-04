"""Data models for LexiLearn API."""

from .audio import (
    AudioProcessRequest,
    DeepgramTranscriptResponse,
    AzurePronunciationResult,
    PhonemeDetail,
)
from .assessment import (
    IELTSAssessmentResult,
    BandScore,
    LexicalAnalysis,
    GrammarAnalysis,
)

__all__ = [
    "AudioProcessRequest",
    "DeepgramTranscriptResponse",
    "AzurePronunciationResult",
    "PhonemeDetail",
    "IELTSAssessmentResult",
    "BandScore",
    "LexicalAnalysis",
    "GrammarAnalysis",
]
