"""Admin dashboard and management routes."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.routes.auth_routes import get_current_user
from app.models.sqlalchemy_models import (
    User, PracticeSession, TestSession, UserFeedback, PracticeAnswer,
    SubscriptionRequest
)
from app.models.schemas import User as UserSchema, UserFeedback as UserFeedbackSchema, UserFeedbackCreate
from app.services.token_service import TokenService, PLAN_DEFS

router = APIRouter(prefix="/admin", tags=["admin"])


def _parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        cleaned = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(cleaned)
        except ValueError:
            return None
    return None

def check_admin(current_user: Any):
    """Dependency to check if the current user is an admin."""
    role = current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", "user")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Get high-level aggregate stats for the admin dashboard."""
    check_admin(admin_user)
    
    total_users = db.query(User).count()
    total_practices = db.query(PracticeAnswer).count()
    total_tests = db.query(TestSession).count()

    # Engagement metrics
    avg_duration = db.query(func.avg(PracticeAnswer.duration_seconds)).scalar() or 0
    avg_rating = db.query(func.avg(UserFeedback.rating)).scalar() or 0
    avg_rating = float(avg_rating)

    # Active users in last 7 days (based on practice answer and test started time)
    threshold = datetime.utcnow() - timedelta(days=7)
    practice_rows = db.query(PracticeAnswer.session_id, PracticeAnswer.created_at).all()
    session_map = {
        s.id: s.user_id for s in db.query(PracticeSession.id, PracticeSession.user_id).all()
    }
    active_users = set()
    for session_id, created_at in practice_rows:
        dt = _parse_dt(created_at)
        if dt and dt >= threshold:
            user_id = session_map.get(session_id)
            if user_id:
                active_users.add(user_id)

    test_rows = db.query(TestSession.user_id, TestSession.started_at).all()
    for user_id, started_at in test_rows:
        dt = _parse_dt(started_at)
        if dt and dt >= threshold and user_id:
            active_users.add(user_id)

    active_users_7d = len(active_users)
    retention_7d = (active_users_7d / total_users * 100) if total_users > 0 else 0.0

    # Satisfaction index (0-100):
    # 50% explicit rating + 30% engagement + 20% retention
    explicit_rating_score = (avg_rating / 5.0) * 100 if avg_rating > 0 else 0.0
    active_base = max(1, active_users_7d)
    avg_actions_per_active = (total_practices + total_tests) / active_base
    engagement_score = min(100.0, (avg_actions_per_active / 20.0) * 100.0)
    satisfaction_index = round(
        (explicit_rating_score * 0.5) + (engagement_score * 0.3) + (retention_7d * 0.2),
        1
    )

    low_feedbacks = db.query(UserFeedback).filter(UserFeedback.rating <= 2).count()

    return {
        "stats": {
            "totalUsers": total_users,
            "totalPractices": total_practices,
            "totalTests": total_tests,
            "avgDurationPerAnswer": round(float(avg_duration), 1),
            "avgSatisfaction": round(float(avg_rating), 1),
            "activeUsers7d": active_users_7d,
            "retention7dPercent": round(retention_7d, 1),
            "satisfactionIndex": satisfaction_index,
            "lowRatingCount": low_feedbacks
        },
        "logic": {
            "formula": "0.5*explicit_rating + 0.3*engagement + 0.2*retention_7d",
            "explicit_rating_score": round(explicit_rating_score, 1),
            "engagement_score": round(engagement_score, 1),
            "retention_score": round(retention_7d, 1),
            "avgActionsPerActiveUser": round(avg_actions_per_active, 2)
        },
        "trends": []
    }

@router.get("/users", response_model=List[UserSchema])
def list_users(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """List all registered users."""
    check_admin(admin_user)
    return db.query(User).all()

@router.get("/feedback", response_model=List[UserFeedbackSchema])
def list_feedback(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """List all user feedback/ratings."""
    check_admin(admin_user)
    return db.query(UserFeedback).order_by(UserFeedback.created_at.desc()).all()

@router.post("/feedback")
def submit_feedback(
    feedback: UserFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Allow users to submit feedback."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    db_feedback = UserFeedback(
        user_id=user_id,
        rating=feedback.rating,
        comment=feedback.comment,
        category=feedback.category
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@router.get("/billing/pending")
def list_pending_subscription_requests(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """List subscription requests waiting for admin review."""
    check_admin(admin_user)
    rows = (
        db.query(SubscriptionRequest)
        .filter(SubscriptionRequest.status == "pending")
        .order_by(SubscriptionRequest.created_at.desc())
        .all()
    )
    return rows


@router.post("/billing/requests/{request_id}/approve")
def approve_subscription_request(
    request_id: str,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Approve transfer and activate user's plan."""
    check_admin(admin_user)
    req = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already reviewed")

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan = TokenService.get_effective_plan(db, req.plan_code)
    wallet = TokenService.get_or_create_wallet(db, user)
    wallet.plan_code = req.plan_code
    wallet.monthly_token_limit = int(plan["monthly_tokens"])
    wallet.token_balance = max(int(wallet.token_balance or 0), int(plan["monthly_tokens"]))

    reviewer_id = admin_user.get("id") if isinstance(admin_user, dict) else admin_user.id
    req.status = "approved"
    req.reviewed_by = reviewer_id
    req.reviewed_at = datetime.utcnow().isoformat()
    db.commit()
    return {"message": "Request approved", "request_id": req.id, "status": req.status}


@router.post("/billing/requests/{request_id}/reject")
def reject_subscription_request(
    request_id: str,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Reject transfer request."""
    check_admin(admin_user)
    req = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already reviewed")

    reviewer_id = admin_user.get("id") if isinstance(admin_user, dict) else admin_user.id
    req.status = "rejected"
    req.reviewed_by = reviewer_id
    req.reviewed_at = datetime.utcnow().isoformat()
    db.commit()
    return {"message": "Request rejected", "request_id": req.id, "status": req.status}


@router.get("/billing/plans")
def list_plan_configs(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Get effective plan configs for admin."""
    check_admin(admin_user)
    TokenService.ensure_plan_rows(db)
    return {
        "plans": [
            {"code": code, **TokenService.get_effective_plan(db, code)}
            for code in PLAN_DEFS.keys()
        ]
    }


@router.put("/billing/plans/{plan_code}")
def update_plan_config(
    plan_code: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Admin can update price/token/costs for each plan."""
    check_admin(admin_user)
    if plan_code not in PLAN_DEFS:
        raise HTTPException(status_code=404, detail="Plan not found")

    TokenService.ensure_plan_rows(db)
    from app.models.sqlalchemy_models import BillingPlan
    row = db.query(BillingPlan).filter(BillingPlan.code == plan_code).first()
    if not row:
        raise HTTPException(status_code=404, detail="Plan config not found")

    allowed_fields = {
        "name", "monthly_tokens", "practice_cost",
        "test_start_cost", "daily_trial_bonus", "price_vnd"
    }
    for k, v in payload.items():
        if k in allowed_fields and v is not None:
            setattr(row, k, v)

    row.updated_at = datetime.utcnow().isoformat()
    db.commit()
    return {"message": "Plan updated", "plan": {"code": plan_code, **TokenService.get_effective_plan(db, plan_code)}}
