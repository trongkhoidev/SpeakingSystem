"""Test exam routes."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.routes.auth_routes import get_current_user
from app.models.sqlalchemy_models import User, TestSession, ExamSet
from app.models.schemas import TestSession as TestSessionSchema, TestSessionCreate, TestStartResponse, ExamSet as ExamSetSchema
from app.models.assessment import IELTSAssessmentResult
from app.services.test_service import TestService
from app.services.assessment_service import AssessmentService
from app.services.trial_service import TrialService
from app.services.token_service import TokenService

router = APIRouter(prefix="/test", tags=["test"])
assessment_service = AssessmentService()


@router.post("/start", response_model=TestStartResponse)
def start_test(
    config: TestSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new test session and return questions."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    user_role = current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", "user")

    if user_role == "guest":
        if not TrialService.can_test(db, user_id):
            raise HTTPException(
                status_code=403, 
                detail="Guest trial quota reached. Please sign in with Google to continue."
            )
        TrialService.increment_test(db, user_id)
    else:
        wallet = TokenService.get_or_create_wallet(db, current_user)
        plan = TokenService.get_effective_plan(db, wallet.plan_code)
        TokenService.consume_tokens(db, current_user, int(plan["test_start_cost"]))

    session = TestService.create_session(db, user_id=user_id, config=config)
    questions = TestService.get_test_questions(db, config=config)
    
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
    part_number: int = Form(1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer for a test question and get assessment."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Test session not found")
    # Allow if session belongs to user, OR if guest session (user_id is None)
    if session.user_id is not None and session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized or session not found")
        
    return await assessment_service.run_assessment_pipeline(
        audio_data=await audio_file.read(),
        audio_filename=audio_file.filename or "audio.webm",
        question_text=question_text,
        user_id=user_id,
        question_id=question_id,
        session_id=session_id,
        db=db
    )


@router.post("/{session_id}/complete", response_model=TestSessionSchema)
def complete_test(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a test session as complete and calculate scores."""
    session = TestService.complete_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Test session not found")
    
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return session


@router.get("/{session_id}/report")
def get_test_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the detailed report for a test session."""
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Test session not found")
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    report = TestService.get_session_report(db, session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not available")
        
    return report


@router.get("/history", response_model=List[TestSessionSchema])
def get_test_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the user's test history."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return TestService.get_user_test_history(db, user_id)

@router.get("/exam-sets", response_model=List[ExamSetSchema])
async def get_exam_sets(
    db: Session = Depends(get_db)
):
    """Get all available pre-built exam sets."""
    return db.query(ExamSet).filter(ExamSet.is_active == True).all()
