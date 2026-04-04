from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.routes.auth_routes import get_current_user
from app.models.sqlalchemy_models import User
from app.models.schemas import TestSession, TestSessionCreate, TestStartResponse
from app.models.assessment import IELTSAssessmentResult
from app.services.test_service import TestService
from app.services.assessment_service import AssessmentService
from fastapi import UploadFile, File, Form

router = APIRouter(prefix="/test", tags=["test"])
assessment_service = AssessmentService()

@router.post("/start", response_model=TestStartResponse)
def start_test(
    config: TestSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new test session and return questions."""
    session = TestService.create_session(
        db, user_id=current_user.id, mode=config.mode, config=config.config
    )
    
    questions = TestService.get_test_questions(
        db, mode=config.mode, config=config.config
    )
    
    return {
        "session": session,
        "questions": questions
    }

@router.post("/{session_id}/answer", response_model=IELTSAssessmentResult)
async def submit_test_answer(
    session_id: str,
    audio_file: UploadFile = File(...),
    question_id: str = Form(...),
    question_text: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer for a test question and get assessment."""
    # Verify session ownership
    from app.models.sqlalchemy_models import TestSession as TestSessionModel
    session = db.query(TestSessionModel).filter(TestSessionModel.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized or session not found")
        
    return await assessment_service.run_assessment_pipeline(
        audio_data=await audio_file.read(),
        audio_filename=audio_file.filename or "audio.webm",
        question_text=question_text,
        user_id=current_user.id,
        question_id=question_id,
        session_id=session_id,
        db=db
    )

@router.post("/{session_id}/complete", response_model=TestSession)
def complete_test(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a test session as complete and calculate scores."""
    session = TestService.complete_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Test session not found")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return session

@router.get("/{session_id}/report")
def get_test_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the detailed report for a test session."""
    report = TestService.get_session_report(db, session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Test session not found")
        
    # We should also check ownership, but the session record was already fetched
    # Let's verify owner via the raw session model
    from app.models.sqlalchemy_models import TestSession as TestSessionModel
    session = db.query(TestSessionModel).filter(TestSessionModel.id == session_id).first()
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return report

@router.get("/history", response_model=List[TestSession])
def get_test_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the user's test history."""
    return TestService.get_user_test_history(db, current_user.id)
