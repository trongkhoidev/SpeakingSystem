from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from ..core.database import get_db
from ..routes.auth_routes import get_current_user
from ..models.sqlalchemy_models import User, Question
from ..models.schemas import Question as QuestionSchema, QuestionBase

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post("/custom", response_model=QuestionSchema)
async def create_custom_question(
    question_data: QuestionBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new custom question for the current user."""
    new_question = Question(
        id=str(uuid.uuid4()),
        text=question_data.text,
        part=question_data.part,
        is_custom=True,
        user_id=current_user.id
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    return new_question

@router.get("/custom", response_model=List[QuestionSchema])
async def get_custom_questions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all custom questions created by the current user."""
    questions = db.query(Question).filter(
        Question.is_custom == True,
        Question.user_id == current_user.id
    ).all()
    
    return questions
