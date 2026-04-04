"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    id: str # Google Sub ID

class User(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class GoogleLoginRequest(BaseModel):
    id_token: str

class TopicBase(BaseModel):
    title: str
    description: Optional[str] = None
    part: int

class Topic(TopicBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    text: str
    part: int
    is_custom: bool = False
    topic_id: Optional[int] = None
    bullets: Optional[List[str]] = None

class Question(QuestionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TestSessionBase(BaseModel):
    mode: str
    config: Optional[dict] = None

class TestSessionCreate(TestSessionBase):
    pass

class TestSession(TestSessionBase):
    id: str
    user_id: str
    overall_band: Optional[float] = None
    is_completed: bool
    created_at: datetime
    completed_at: Optional[datetime] = None

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
