from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import json
from ..core.database import get_db
from ..routes.auth_routes import get_current_user
from ..models.sqlalchemy_models import User, PracticeSession, CustomQuestion, PracticeAnswer, Topic, Question
from ..models.schemas import TopicWithQuestions
from pydantic import BaseModel

router = APIRouter(prefix="/practice", tags=["practice"])

class QuestionInput(BaseModel):
    text: str
    part: int

class SessionCreateRequest(BaseModel):
    title: str
    questions: List[QuestionInput]

@router.post("/session")
async def create_practice_session(
    data: SessionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Extract user_id — current_user may be a dict (guest) or User ORM object
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id

    # 1. Create Session
    session = PracticeSession(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=data.title
    )
    db.add(session)
    
    # 2. Add Questions
    saved_questions = []
    for q_in in data.questions:
        q = CustomQuestion(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session.id,
            question_text=q_in.text,
            part=q_in.part
        )
        db.add(q)
        saved_questions.append(q)
    
    db.commit()
    db.refresh(session)
    
    return {
        "id": session.id,
        "title": session.title,
        "questions": [
            {"id": q.id, "question_text": q.question_text, "part": q.part} 
            for q in saved_questions
        ]
    }

@router.get("/sessions")
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id
    ).order_by(PracticeSession.started_at.desc()).all()
    
    result = []
    for s in sessions:
        # Count questions and answers
        q_count = db.query(CustomQuestion).filter(CustomQuestion.session_id == s.id).count()
        answers = db.query(PracticeAnswer).join(CustomQuestion).filter(CustomQuestion.session_id == s.id).all()
        a_count = len(answers)
        avg_band = sum(a.overall_band for a in answers) / a_count if a_count > 0 else 0
        
        result.append({
            "id": s.id,
            "title": s.title,
            "started_at": s.started_at,
            "question_count": q_count,
            "answer_count": a_count,
            "avg_band": avg_band
        })
    
    return result

@router.get("/sessions/{session_id}/questions")
async def get_session_questions(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    questions = db.query(CustomQuestion).filter(
        CustomQuestion.session_id == session_id,
        CustomQuestion.user_id == user_id
    ).all()
    
    # Also fetch answers for these questions
    result = []
    for q in questions:
        answer = db.query(PracticeAnswer).filter(
            PracticeAnswer.custom_question_id == q.id
        ).first()
        
        result.append({
            "id": q.id,
            "question_text": q.question_text,
            "part": q.part,
            "status": "answered" if answer else "pending",
            "feedback": json.loads(answer.llm_result) if answer and answer.llm_result else None,
            "overall_band": answer.overall_band if answer else None
        })
        
    return result

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    session = db.query(PracticeSession).filter(
        PracticeSession.id == session_id,
        PracticeSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

@router.get("/topics", response_model=List[TopicWithQuestions])
async def get_curated_topics(
    db: Session = Depends(get_db)
):
    """Get all curated topics with their questions for the suggestion panel."""
    topics = db.query(Topic).order_by(Topic.order_index).all()
    # questions are loaded via relationship automatically if configured, 
    # but let's ensure they are there.
    return topics
