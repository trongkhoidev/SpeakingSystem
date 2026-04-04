"""Topic routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..routes.auth_routes import get_current_user
from ..models.sqlalchemy_models import User, Topic, Question
from ..models.schemas import Topic as TopicSchema, Question as QuestionSchema

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=List[TopicSchema])
async def get_topics(
    part: Optional[int] = Query(None, description="Filter topics by IELTS Part (1, 2, or 3)"),
    db: Session = Depends(get_db)
):
    """Get all topics, optionally filtered by part."""
    query = db.query(Topic)
    if part is not None and part > 0:
        query = query.filter(Topic.part == part)
    
    return query.order_by(Topic.order_index).all()


@router.get("/{topic_id}/questions", response_model=List[QuestionSchema])
async def get_topic_questions(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all questions for a specific topic."""
    questions = db.query(Question).filter(
        Question.topic_id == topic_id
    ).order_by(Question.order_index).all()
    
    return questions
