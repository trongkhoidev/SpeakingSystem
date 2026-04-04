"""IELTS Assessment and scoring models."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class SpeakingSession(BaseModel):
    """A collection of speaking questions for a practice session."""
    id: UUID
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime


class SpeakingQuestion(BaseModel):
    """An individual question within a session."""
    id: UUID
    session_id: UUID
    question_text: str
    part: int
    order_index: int
    created_at: datetime


class LexicalAnalysis(BaseModel):
    """Lexical Resource analysis from LLM."""
    
    score: float  # 0-9
    feedback: str
    word_list: List[str]  # Band 8+ vocabulary identified
    variety_level: str  # Limited, Adequate, Good, Excellent


class GrammarAnalysis(BaseModel):
    """Grammar analysis from LLM."""
    
    score: float  # 0-9
    feedback: str
    error_count: int
    error_types: List[str]
    complexity_level: str  # Simple, Intermediate, Advanced


class BandScores(BaseModel):
    """Individual IELTS band scores."""
    
    fluency_coherence: float = Field(..., alias="FC")
    lexical_resource: float = Field(..., alias="LR")
    grammatical_accuracy: float = Field(..., alias="GRA")
    pronunciation: float = Field(..., alias="PRON")

    class Config:
        populate_by_name = True


class IELTSAssessmentResult(BaseModel):
    """Complete IELTS assessment result for an answer."""
    
    id: Optional[UUID] = None
    question_id: UUID
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Transcription & Stage 0 (Gatekeeper)
    student_transcript: str
    is_relevant: bool = True
    relevance_score: int = 100
    
    # Raw scores from APIs (Stage 1)
    azure_pronunciation: Dict[str, Any]
    
    # AI Analysis (Stage 2)
    feedback_json: Dict[str, Any]
    
    # Final Scores
    band_scores: BandScores
    overall_band: float  # 0-9 (IELTS overall)
    
    # UI Helpers
    color_coded_transcript: List[Dict[str, Any]]  # [{word, color, phonetic_error?}]
    
    # Storage
    audio_url: Optional[str] = None


class AssessmentSummary(BaseModel):
    """Lightweight summary for dashboard display."""
    
    id: UUID
    overall_band: float
    band_scores: BandScores
    timestamp: datetime
