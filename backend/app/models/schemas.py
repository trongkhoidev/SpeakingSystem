"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    id: str  # Google Sub ID


class User(UserBase):
    id: str
    day_streak: int = 0
    estimated_band: float = 0.0
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class GoogleLoginRequest(BaseModel):
    id_token: str


class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    part: int


class Topic(TopicBase):
    id: str
    order_index: Optional[int] = None

    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    question_text: str
    part: int
    topic_id: Optional[str] = None
    model_answer: Optional[str] = None
    cue_card_json: Optional[str] = None


class Question(QuestionBase):
    id: str

    class Config:
        from_attributes = True


class CustomQuestionBase(BaseModel):
    question_text: str
    part: int


class CustomQuestion(CustomQuestionBase):
    id: str
    user_id: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class TestSessionBase(BaseModel):
    examiner_voice: Optional[str] = None
    question_count: Optional[int] = None
    follow_up_enabled: bool = False
    parts_included: Optional[int] = None


class TestSessionCreate(TestSessionBase):
    pass


class TestSession(TestSessionBase):
    id: str
    user_id: str
    overall_band: Optional[float] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

    class Config:
        from_attributes = True


class TestStartResponse(BaseModel):
    session: TestSession
    questions: List[Question]


class DashboardResponse(BaseModel):
    streak: int
    dailyMission: dict
    bandEstimate: dict
    forecast: List[dict]
    heatmap: List[dict]
