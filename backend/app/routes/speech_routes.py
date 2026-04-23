"""Speech processing routes."""

import asyncio
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
import logging
from pydantic import BaseModel

from app.core.database import get_db
from app.routes.auth_routes import get_current_user
from app.models.sqlalchemy_models import User, PracticeSession
from app.models.assessment import IELTSAssessmentResult
from app.services.assessment_service import AssessmentService
from app.services.trial_service import TrialService
from app.services.token_service import TokenService
import uuid

router = APIRouter(prefix="/speech", tags=["speech"])
logger = logging.getLogger(__name__)

# Initialize services
assessment_service = AssessmentService()


@router.post("/assess", response_model=IELTSAssessmentResult)
async def assess_speech(
    audio_file: UploadFile = File(...),
    question_id: str = Form(...),
    question_text: str = Form(...),
    mode: str = Form("practice"),
    custom_question_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main assessment endpoint.
    Process speech through the full AI pipeline:
      Stage 0 (Gatekeeper) → Stage 1 (Azure) → Stage 2 (LLM) → Scoring
    
    Fields:
      - audio_file: WAV/WebM audio file
      - question_id: UUID of the question (nullable for custom)
      - question_text: Text of the question
      - mode: "practice" | "test"
      - custom_question_id: UUID of custom question (nullable)
    """
    
    try:
        raw_audio = await audio_file.read()
        if not raw_audio:
            raise HTTPException(status_code=400, detail="Empty audio file")

        # Enforce trial limits for guests
        user_role = "user"
        user_id = ""
        
        if isinstance(current_user, dict):
            user_id = current_user.get("id", "")
            user_role = current_user.get("role", "user")
        else:
            user_id = current_user.id
            user_role = getattr(current_user, "role", "user")

        if user_role == "guest" and not TrialService.can_practice(db, user_id):
            raise HTTPException(
                status_code=403,
                detail="Guest trial quota reached. Please sign in with Google to continue."
            )
        if user_role != "guest":
            wallet = TokenService.get_or_create_wallet(db, current_user)
            plan = TokenService.get_effective_plan(db, wallet.plan_code)
            TokenService.consume_tokens(db, current_user, int(plan["practice_cost"]))

        # Create a PracticeSession so answers are linked for heatmap/streak queries
        practice_session = PracticeSession(user_id=user_id if user_role != "guest" else None)
        db.add(practice_session)
        db.commit()
        db.refresh(practice_session)

        result = await assessment_service.run_assessment_pipeline(
            audio_data=raw_audio,
            audio_filename=audio_file.filename or "audio.webm",
            question_text=question_text,
            user_id=user_id,
            question_id=question_id,
            session_id=str(practice_session.id),
            db=db
        )
        if user_role == "guest":
            TrialService.increment_practice(db, user_id)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Speech processing failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class ExplainMoreRequest(BaseModel):
    """Request model for the Explain More endpoint."""
    answer_id: str
    criterion: str  # "fluency_coherence" | "lexical_resource" | "grammatical_accuracy" | "pronunciation"
    original_reasoning: str
    transcript: str


@router.post("/explain-more")
async def explain_more(
    request: ExplainMoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deeper AI analysis for one criterion.
    Sends the original reasoning + transcript to Gemini for a more detailed explanation.
    Returns Vietnamese explanation with examples and suggestions.
    """
    from app.services.llm_service import LLMService
    
    try:
        llm_service = LLMService()
        result = await llm_service.explain_more(
            criterion=request.criterion,
            original_reasoning=request.original_reasoning,
            transcript=request.transcript
        )
        return result
    except Exception as e:
        logger.error(f"Explain more failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trial-status")
async def get_trial_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check remaining trial uses for the current user/guest."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return TrialService.get_status(db, user_id)
