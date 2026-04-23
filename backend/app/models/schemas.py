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
    role: str = "user"
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


class TopicWithQuestions(Topic):
    questions: List[Question] = []


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
    exam_set_id: Optional[str] = None


class TestSession(TestSessionBase):
    id: str
    user_id: Optional[str] = None
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


class UserFeedbackCreate(BaseModel):
    user_id: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    category: Optional[str] = "General"


class UserFeedback(UserFeedbackCreate):
    id: str
    created_at: str

    class Config:
        from_attributes = True


class GuestTrialStatus(BaseModel):
    guest_id: str
    practice_count: int
    test_count: int
    practice_remaining: int
    test_remaining: int


class PlanInfo(BaseModel):
    code: str
    name: str
    monthly_tokens: int
    practice_cost: int
    test_start_cost: int
    daily_trial_bonus: int
    price_vnd: int


class UsageStatus(BaseModel):
    plan_code: str
    plan_name: str
    price_vnd: int
    token_balance: int
    monthly_token_used: int
    monthly_token_limit: int
    lifetime_token_used: int
    costs: dict
    daily_trial_bonus: int
    social_reward_tokens: int
    facebook_rewarded: bool
    x_rewarded: bool


class ExamSetBase(BaseModel):
    name: str
    description: Optional[str] = None
    estimated_minutes: int = 14
    difficulty: str = "medium"


class ExamSet(ExamSetBase):
    id: str
    question_ids_json: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True
