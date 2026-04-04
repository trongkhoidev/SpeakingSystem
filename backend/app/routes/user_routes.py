from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Any, Dict, List, Optional
from ..core.database import get_db
from ..routes.auth_routes import get_current_user
from ..models.sqlalchemy_models import User, Answer, Question
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
    limit: int = 20
):
    """Fetch recent practice history for the user."""
    
    try:
        answers = db.query(Answer).join(Question).filter(
            Answer.user_id == current_user.id
        ).order_by(desc(Answer.created_at)).limit(limit).all()
        
        return [
            {
                "id": str(a.id),
                "question_text": a.question.text,
                "overall_band": a.band_overall,
                "created_at": a.created_at.isoformat(),
                "part": a.question.part
            }
            for a in answers
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {str(e)}"
        )
