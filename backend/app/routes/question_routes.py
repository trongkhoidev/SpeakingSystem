"""Question routes — custom questions + questions by part."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from ..core.database import get_db
from ..routes.auth_routes import get_current_user
from ..models.sqlalchemy_models import User, Question, CustomQuestion
from ..models.schemas import (
    Question as QuestionSchema,
    CustomQuestionBase,
    CustomQuestion as CustomQuestionSchema,
)

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=List[QuestionSchema])
async def get_questions_by_part(
    part: Optional[int] = Query(None, description="Filter by IELTS Part (1, 2, or 3)"),
    db: Session = Depends(get_db)
):
    """Fetch questions by part number."""
    query = db.query(Question)
    if part is not None:
        query = query.filter(Question.part == part)
    return query.order_by(Question.order_index).all()


@router.post("/custom", response_model=CustomQuestionSchema)
async def create_custom_question(
    question_data: CustomQuestionBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new custom question for the current user."""
    new_question = CustomQuestion(
        id=str(uuid.uuid4()),
        question_text=question_data.question_text,
        part=question_data.part,
        user_id=current_user.id
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    return new_question


@router.get("/custom", response_model=List[CustomQuestionSchema])
async def get_custom_questions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all custom questions created by the current user."""
    questions = db.query(CustomQuestion).filter(
        CustomQuestion.user_id == current_user.id
    ).all()
    
    return questions
