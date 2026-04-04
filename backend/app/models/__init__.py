"""Data models for LexiLearn API."""

from .audio import (
    AudioProcessRequest,
    DeepgramTranscriptResponse,
    AzurePronunciationResult,
    PhonemeDetail,
)
from .assessment import (
    IELTSAssessmentResult,
    BandScores,
    LexicalAnalysis,
    GrammarAnalysis,
)

__all__ = [
    "AudioProcessRequest",
    "DeepgramTranscriptResponse",
    "AzurePronunciationResult",
    "PhonemeDetail",
    "IELTSAssessmentResult",
    "BandScores",
    "LexicalAnalysis",
    "GrammarAnalysis",
]
