"""User routes — dashboard data and practice history."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Any, Dict, List, Optional
from ..core.database import get_db
from ..routes.auth_routes import get_current_user
from ..models.sqlalchemy_models import User, PracticeAnswer, Question
from ..services.dashboard_service import DashboardService

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate dashboard metrics for the user."""
    
    try:
        service = DashboardService()
        
        return {
            "streak": service.get_streak(current_user.id, db),
            "dailyMission": service.get_daily_mission(current_user.id, db),
            "bandEstimate": service.get_band_estimate(current_user.id, db),
            "forecast": service.get_forecast_progress(current_user.id, db),
            "heatmap": service.get_heatmap_data(current_user.id, db)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard: {str(e)}"
        )


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Fetch recent practice history for the user with pagination."""
    
    try:
        answers = db.query(PracticeAnswer).join(
            Question, PracticeAnswer.question_id == Question.id
        ).filter(
            PracticeAnswer.session.has(user_id=current_user.id)
        ).order_by(desc(PracticeAnswer.created_at)).offset(offset).limit(limit).all()
        
        return [
            {
                "id": str(a.id),
                "question_text": a.question.question_text if a.question else "Custom question",
                "overall_band": float(a.overall_band) if a.overall_band else None,
                "created_at": str(a.created_at),
                "part": a.question.part if a.question else None
            }
            for a in answers
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {str(e)}"
        )
