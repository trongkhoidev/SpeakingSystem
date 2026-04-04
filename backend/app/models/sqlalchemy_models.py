"""SQLAlchemy ORM models aligned with the approved design ERD."""

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Text, Date
from sqlalchemy import NVARCHAR, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from ..core.database import Base


class User(Base):
    """User profile table.
    
    Design: UUID PK, Google OAuth fields, streak/band tracking.
    Implementation note: Using Google Sub ID as PK (String) for simplicity,
    since it's the primary identifier from Google OAuth.
    """
    __tablename__ = "users"
    
    id = Column(String(255), primary_key=True, index=True)  # Google Sub ID
    email = Column(NVARCHAR(100), unique=True, index=True, nullable=False)
    full_name = Column(NVARCHAR(200))
    google_id = Column(NVARCHAR(500), unique=True, nullable=True)
    avatar_url = Column(NVARCHAR(500))
    day_streak = Column(Integer, default=0)
    last_practice_date = Column(Date, nullable=True)
    estimated_band = Column(DECIMAL(3, 1), default=0.0)
    streak_calendar = Column(Text, nullable=True)  # JSON string
    created_at = Column(NVARCHAR(50), server_default=func.now())
    
    # Relationships
    practice_sessions = relationship("PracticeSession", back_populates="user")
    test_sessions = relationship("TestSession", back_populates="user")
    custom_questions = relationship("CustomQuestion", back_populates="user")


class Topic(Base):
    """IELTS topic table."""
    __tablename__ = "topics"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(NVARCHAR(200), nullable=False)
    part = Column(Integer, nullable=False)  # 1, 2, or 3
    description = Column(NVARCHAR(500), nullable=True)
    order_index = Column(Integer, nullable=True)
    
    questions = relationship("Question", back_populates="topic")


class Question(Base):
    """IELTS question bank table."""
    __tablename__ = "questions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id"), nullable=True)
    part = Column(Integer, nullable=False)  # 1, 2, or 3
    question_text = Column(Text, nullable=False)
    model_answer = Column(Text, nullable=True)
    cue_card_json = Column(Text, nullable=True)  # Part 2 only - JSON
    order_index = Column(Integer, nullable=True)
    cefr_level = Column(NVARCHAR(10), nullable=True)
    
    topic = relationship("Topic", back_populates="questions")
    practice_answers = relationship("PracticeAnswer", back_populates="question")
    test_answers = relationship("TestAnswer", back_populates="question")


class CustomQuestion(Base):
    """User-created custom questions."""
    __tablename__ = "custom_questions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    part = Column(Integer, nullable=False)  # 1, 2, or 3
    question_text = Column(Text, nullable=False)
    created_at = Column(NVARCHAR(50), server_default=func.now())
    
    user = relationship("User", back_populates="custom_questions")
    practice_answers = relationship("PracticeAnswer", back_populates="custom_question")


class PracticeSession(Base):
    """Groups related practice answers."""
    __tablename__ = "practice_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id"), nullable=True)
    part = Column(Integer, nullable=True)
    started_at = Column(NVARCHAR(50), server_default=func.now())
    completed_at = Column(NVARCHAR(50), nullable=True)
    
    user = relationship("User", back_populates="practice_sessions")
    answers = relationship("PracticeAnswer", back_populates="session")


class PracticeAnswer(Base):
    """Individual practice answer with full scoring data."""
    __tablename__ = "practice_answers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("practice_sessions.id"), nullable=True)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=True)
    custom_question_id = Column(String(36), ForeignKey("custom_questions.id"), nullable=True)
    
    student_transcript = Column(Text, nullable=True)
    audio_blob_url = Column(NVARCHAR(500), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    # Raw AI results (stored as JSON text)
    azure_result = Column(Text, nullable=True)  # JSON
    llm_result = Column(Text, nullable=True)  # JSON
    
    # Azure sub-scores (0-100)
    accuracy_score = Column(DECIMAL(5, 1), nullable=True)
    fluency_score = Column(DECIMAL(5, 1), nullable=True)
    completeness_score = Column(DECIMAL(5, 1), nullable=True)
    prosody_score = Column(DECIMAL(5, 1), nullable=True)
    
    # IELTS Band scores (0-9)
    fc_band = Column(DECIMAL(3, 1), nullable=True)
    lr_band = Column(DECIMAL(3, 1), nullable=True)
    gra_band = Column(DECIMAL(3, 1), nullable=True)
    pronunciation_band = Column(DECIMAL(3, 1), nullable=True)
    overall_band = Column(DECIMAL(3, 1), nullable=True)
    
    # Word-level details (JSON)
    word_details = Column(Text, nullable=True)
    
    created_at = Column(NVARCHAR(50), server_default=func.now())
    
    session = relationship("PracticeSession", back_populates="answers")
    question = relationship("Question", back_populates="practice_answers")
    custom_question = relationship("CustomQuestion", back_populates="practice_answers")


class TestSession(Base):
    """IELTS test exam session."""
    __tablename__ = "test_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    examiner_voice = Column(NVARCHAR(100), nullable=True)
    question_count = Column(Integer, nullable=True)
    follow_up_enabled = Column(Boolean, default=False)
    parts_included = Column(Integer, nullable=True)  # Bitmask or comma-separated
    overall_band = Column(DECIMAL(3, 1), nullable=True)
    part_scores = Column(Text, nullable=True)  # JSON
    started_at = Column(NVARCHAR(50), server_default=func.now())
    completed_at = Column(NVARCHAR(50), nullable=True)
    
    user = relationship("User", back_populates="test_sessions")
    answers = relationship("TestAnswer", back_populates="test_session")


class TestAnswer(Base):
    """Individual test answer."""
    __tablename__ = "test_answers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_session_id = Column(String(36), ForeignKey("test_sessions.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    part_number = Column(Integer, nullable=True)
    
    student_transcript = Column(Text, nullable=True)
    audio_blob_url = Column(NVARCHAR(500), nullable=True)
    
    # Raw AI results (JSON)
    azure_result = Column(Text, nullable=True)
    llm_result = Column(Text, nullable=True)
    
    # IELTS Band score
    overall_band = Column(DECIMAL(3, 1), nullable=True)
    
    # Word-level details (JSON)
    word_details = Column(Text, nullable=True)
    
    created_at = Column(NVARCHAR(50), server_default=func.now())
    
    test_session = relationship("TestSession", back_populates="answers")
    question = relationship("Question", back_populates="test_answers")
