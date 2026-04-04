"""Speech processing routes."""

import asyncio
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Header
from typing import Optional, List
import logging
from datetime import datetime
from uuid import UUID

from app.models.assessment import (
    IELTSAssessmentResult,
    BandScores,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(prefix="/speech", tags=["speech"])
logger = logging.getLogger(__name__)

# Initialize services
assessment_service = AssessmentService()


@router.post("/assess", response_model=IELTSAssessmentResult)
async def assess_speech(
    audio_file: UploadFile = File(...),
    user_id: str = Form(...),
    question_id: str = Form(...),
    question_text: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Process speech through the 3-Stage Pipeline described in speaking.md.
    """
    
    try:
        raw_audio = await audio_file.read()
        if not raw_audio:
            raise HTTPException(status_code=400, detail="Empty audio file")

        # Use the assessment service to run the full pipeline and persist to DB
        return await assessment_service.run_assessment_pipeline(
            audio_data=raw_audio,
            audio_filename=audio_file.filename or "audio.webm",
            question_text=question_text,
            user_id=user_id,
            question_id=question_id,
            db=db
        )

    except Exception as e:
        logger.error(f"Speech processing failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
