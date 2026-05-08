"""SQLAlchemy ORM models aligned with the approved design ERD."""

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Text, Date, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from ..core.database import Base

from sqlalchemy.dialects.mssql import NVARCHAR as MSSQL_NVARCHAR

# Map to NVARCHAR(MAX) for SQL Server
NVARCHAR_MAX = MSSQL_NVARCHAR(None)


class User(Base):
    """User profile table.
    
    Design: UUID PK, Google OAuth fields, streak/band tracking.
    Implementation note: Using Google Sub ID as PK (String) for simplicity,
    since it's the primary identifier from Google OAuth.
    """
    __tablename__ = "users"
    
    id = Column(String(255), primary_key=True, index=True)  # Google Sub ID
    email = Column(MSSQL_NVARCHAR(100), unique=True, index=True, nullable=False)
    full_name = Column(MSSQL_NVARCHAR(200))
    google_id = Column(MSSQL_NVARCHAR(500), nullable=True)
    avatar_url = Column(MSSQL_NVARCHAR(500))
    day_streak = Column(Integer, default=0)
    last_practice_date = Column(Date, nullable=True)
    estimated_band = Column(DECIMAL(3, 1), default=0.0)
    streak_calendar = Column(NVARCHAR_MAX, nullable=True)  # JSON string
    role = Column(MSSQL_NVARCHAR(20), default="user")  # admin, user
    status = Column(MSSQL_NVARCHAR(20), default="active")  # active, suspended
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    
    # Relationships
    wallet = relationship("UserTokenWallet", back_populates="user", uselist=False)
    practice_sessions = relationship("PracticeSession", back_populates="user")
    test_sessions = relationship("TestSession", back_populates="user")
    custom_questions = relationship("CustomQuestion", back_populates="user")
    feedbacks = relationship("UserFeedback", back_populates="user")


class Topic(Base):
    """IELTS topic table."""
    __tablename__ = "topics"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(MSSQL_NVARCHAR(200), nullable=False)
    part = Column(Integer, nullable=False)  # 1, 2, or 3
    description = Column(NVARCHAR_MAX, nullable=True)
    order_index = Column(Integer, nullable=True)
    
    questions = relationship("Question", back_populates="topic")


class Question(Base):
    """IELTS question bank table."""
    __tablename__ = "questions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id"), nullable=True)
    part = Column(Integer, nullable=False)  # 1, 2, or 3
    question_text = Column(NVARCHAR_MAX, nullable=False)
    model_answer = Column(NVARCHAR_MAX, nullable=True)
    cue_card_json = Column(NVARCHAR_MAX, nullable=True)  # Part 2 only - JSON
    order_index = Column(Integer, nullable=True)
    cefr_level = Column(MSSQL_NVARCHAR(10), nullable=True)
    linked_part2_id = Column(String(36), ForeignKey("questions.id"), nullable=True)
    
    topic = relationship("Topic", back_populates="questions")
    practice_answers = relationship("PracticeAnswer", back_populates="question")
    test_answers = relationship("TestAnswer", back_populates="question")


class CustomQuestion(Base):
    """User-created custom questions."""
    __tablename__ = "custom_questions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=True)  # Nullable for guests
    part = Column(Integer, nullable=False)  # 1, 2, or 3
    question_text = Column(NVARCHAR_MAX, nullable=False)
    session_id = Column(String(36), ForeignKey("practice_sessions.id"), nullable=True)
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    
    user = relationship("User", back_populates="custom_questions")
    session = relationship("PracticeSession", back_populates="custom_questions")
    practice_answers = relationship("PracticeAnswer", back_populates="custom_question", cascade="all, delete-orphan")


class PracticeSession(Base):
    """Groups related practice answers."""
    __tablename__ = "practice_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=True)  # Nullable for guests
    title = Column(NVARCHAR_MAX, nullable=True)
    topic_id = Column(String(36), ForeignKey("topics.id"), nullable=True)
    mode = Column(MSSQL_NVARCHAR(50), default="normal") # normal, focus
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    
    user = relationship("User", back_populates="practice_sessions")
    custom_questions = relationship("CustomQuestion", back_populates="session")
    answers = relationship("PracticeAnswer", back_populates="session", cascade="all, delete-orphan")


class PracticeAnswer(Base):
    """Single question-answer pair in a practice session."""
    __tablename__ = "practice_answers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("practice_sessions.id"))
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=True)
    custom_question_id = Column(String(36), ForeignKey("custom_questions.id"), nullable=True)
    audio_url = Column(NVARCHAR_MAX, nullable=True)
    transcript = Column(NVARCHAR_MAX, nullable=True)
    feedback_json = Column(NVARCHAR_MAX, nullable=True)
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    
    session = relationship("PracticeSession", back_populates="answers")
    question = relationship("Question", back_populates="practice_answers")
    custom_question = relationship("CustomQuestion", back_populates="practice_answers")


class TestSession(Base):
    """Full IELTS mock test session."""
    __tablename__ = "test_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=True)  # Nullable for guests
    exam_set_id = Column(String(36), ForeignKey("exam_sets.id"), nullable=True)
    overall_band = Column(DECIMAL(3, 1), nullable=True)
    overall_feedback = Column(NVARCHAR_MAX, nullable=True)
    started_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    completed_at = Column(MSSQL_NVARCHAR(50), nullable=True)
    
    user = relationship("User", back_populates="test_sessions")
    exam_set = relationship("ExamSet", back_populates="test_sessions")
    answers = relationship("TestAnswer", back_populates="session", cascade="all, delete-orphan")


class TestAnswer(Base):
    """One part of a full test session."""
    __tablename__ = "test_answers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("test_sessions.id"))
    question_id = Column(String(36), ForeignKey("questions.id"))
    audio_url = Column(NVARCHAR_MAX, nullable=True)
    transcript = Column(NVARCHAR_MAX, nullable=True)
    feedback_json = Column(NVARCHAR_MAX, nullable=True)
    band_score = Column(DECIMAL(3, 1), nullable=True)
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    
    session = relationship("TestSession", back_populates="answers")
    question = relationship("Question", back_populates="test_answers")


class UserFeedback(Base):
    """User feedback for the application."""
    __tablename__ = "user_feedbacks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(NVARCHAR_MAX, nullable=True)
    category = Column(MSSQL_NVARCHAR(50), nullable=True)  # General, AI Accuracy, UI
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    
    user = relationship("User", back_populates="feedbacks")


class UserTokenWallet(Base):
    """Stores token balance and usage stats for a user."""
    __tablename__ = "user_token_wallets"
    
    user_id = Column(String(255), ForeignKey("users.id"), primary_key=True)
    plan_code = Column(MSSQL_NVARCHAR(20), default="free")
    token_balance = Column(Integer, default=0)
    monthly_token_limit = Column(Integer, default=20)
    monthly_token_used = Column(Integer, default=0)
    lifetime_token_used = Column(Integer, default=0)
    expires_at = Column(MSSQL_NVARCHAR(50), nullable=True)
    last_token_reset_at = Column(MSSQL_NVARCHAR(50)) # "YYYY-MM"
    daily_trial_claimed_at = Column(MSSQL_NVARCHAR(50)) # "YYYY-MM-DD"
    facebook_rewarded = Column(Boolean, default=False)
    x_rewarded = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="wallet")


class BillingPlan(Base):
    """Subscription tier definitions."""
    __tablename__ = "billing_plans"
    
    code = Column(MSSQL_NVARCHAR(20), primary_key=True) # free, basic, plus
    name = Column(MSSQL_NVARCHAR(100), nullable=False)
    monthly_tokens = Column(Integer, nullable=False)
    practice_cost = Column(Integer, nullable=False, default=1)
    test_start_cost = Column(Integer, nullable=False, default=5)
    daily_trial_bonus = Column(Integer, nullable=False, default=15)
    price_vnd = Column(Integer, nullable=False, default=0) # Base 1 month price
    price_3m = Column(Integer, nullable=True) # Optional fixed price for 3m
    price_6m = Column(Integer, nullable=True) # Optional fixed price for 6m
    price_12m = Column(Integer, nullable=True) # Optional fixed price for 12m
    bank_account_info = Column(NVARCHAR_MAX, nullable=True) # e.g. "Vietcombank - 123456789 - NGUYEN VAN A"
    updated_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())


class SubscriptionRequest(Base):
    """User transfer request waiting for admin confirmation."""
    __tablename__ = "subscription_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False, index=True)
    plan_code = Column(MSSQL_NVARCHAR(20), nullable=False)
    amount_vnd = Column(Integer, nullable=False)
    transfer_ref = Column(MSSQL_NVARCHAR(200), nullable=True)
    duration_months = Column(Integer, default=1)
    note = Column(NVARCHAR_MAX, nullable=True)
    status = Column(MSSQL_NVARCHAR(20), default="pending", index=True)  # pending/approved/rejected
    reviewed_by = Column(String(255), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(MSSQL_NVARCHAR(50), nullable=True)
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())


class TokenAllocation(Base):
    """Audit log of manual token allocations by admins."""
    __tablename__ = "token_allocations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    reason = Column(NVARCHAR_MAX, nullable=True)
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())


class ExamSet(Base):
    """Predefined sets of questions for full tests."""
    __tablename__ = "exam_sets"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(MSSQL_NVARCHAR(200), nullable=False)
    description = Column(NVARCHAR_MAX, nullable=True)
    question_ids_json = Column(NVARCHAR_MAX, nullable=False) # List of UUIDs
    estimated_minutes = Column(Integer, default=14)
    difficulty = Column(MSSQL_NVARCHAR(20), default="medium") # easy, medium, hard
    tag = Column(MSSQL_NVARCHAR(50), nullable=True) # e.g. "2024 Prediction"
    is_active = Column(Boolean, default=True)
    created_at = Column(MSSQL_NVARCHAR(50), server_default=func.now())
    
    test_sessions = relationship("TestSession", back_populates="exam_set")
