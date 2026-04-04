from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(255), primary_key=True, index=True) # Google Sub ID
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255))
    avatar_url = Column(String(1024))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    answers = relationship("Answer", back_populates="user")
    questions = relationship("Question", back_populates="user")

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1024))
    part = Column(Integer, nullable=False) # 1, 2, or 3
    created_at = Column(DateTime, default=datetime.utcnow)
    
    questions = relationship("Question", back_populates="topic")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    text = Column(String(2048), nullable=False)
    part = Column(Integer, nullable=False)
    is_custom = Column(Boolean, default=False)
    user_id = Column(String(255), ForeignKey("users.id"), nullable=True)
    bullets = Column(JSON, nullable=True) # For Part 2 cue card points
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    topic = relationship("Topic", back_populates="questions")
    user = relationship("User", back_populates="questions")
    answers = relationship("Answer", back_populates="question")

class TestSession(Base):
    __tablename__ = "test_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    
    mode = Column(String(20), nullable=False) # "full", "part1", "part2", "part3"
    config = Column(JSON) # Store Voice, question_count, follow_up params
    
    overall_band = Column(Float)
    is_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="test_sessions")
    answers = relationship("Answer", back_populates="session")

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    session_id = Column(String(36), ForeignKey("test_sessions.id"), nullable=True) # Link to test if applicable
    
    audio_url = Column(String(1024))
    transcript = Column(Text) # Large text storage
    
    # Band Scores
    band_fc = Column(Float)
    band_lr = Column(Float)
    band_gra = Column(Float)
    band_pron = Column(Float)
    band_overall = Column(Float)
    
    # Detailed AI feedback (JSON column)
    feedback_json = Column(JSON)
    azure_results_json = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    session = relationship("TestSession", back_populates="answers")

# Add back_populates to User as well
User.test_sessions = relationship("TestSession", back_populates="user")
