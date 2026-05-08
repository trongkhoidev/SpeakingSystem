"""Admin dashboard and management routes."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
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
    """Get high-level aggregate stats for the admin dashboard (Optimized)."""
    check_admin(admin_user)
    
    from app.models.sqlalchemy_models import GuestTrial
    
    # 1. Basic Stats (Registered Users Only)
    total_users = db.query(User).filter(User.role != "guest").count()
    total_practices = db.query(PracticeAnswer).count()
    total_tests = db.query(TestSession).count()
    
    avg_duration = db.query(func.avg(PracticeAnswer.duration_seconds)).scalar() or 0
    avg_rating = db.query(func.avg(UserFeedback.rating)).scalar() or 0
    low_feedbacks = db.query(UserFeedback).filter(UserFeedback.rating <= 2).count()

    # 2. Guest Trial Analytics
    total_trials = db.query(GuestTrial).count()
    converted_trials = db.query(GuestTrial).filter(GuestTrial.converted_user_id.isnot(None)).count()
    conversion_rate = (converted_trials / max(1, total_trials)) * 100

    # 3. 7-Day Retention & Active Users (SQL Optimized)
    threshold_7d = (datetime.utcnow() - timedelta(days=7)).isoformat()[:10]
    
    # Active user count via UNION of activities (excluding guests)
    active_users_query = text("""
        SELECT COUNT(DISTINCT user_id) FROM (
            SELECT user_id FROM test_sessions WHERE started_at >= :t AND user_id NOT LIKE 'guest-%'
            UNION
            SELECT ps.user_id FROM practice_answers pa 
            JOIN practice_sessions ps ON pa.session_id = ps.id 
            WHERE pa.created_at >= :t AND ps.user_id NOT LIKE 'guest-%'
        ) as active_base
    """)
    active_users_7d = db.execute(active_users_query, {"t": threshold_7d}).scalar() or 0
    retention_7d = (active_users_7d / max(1, total_users) * 100)

    # 4. Refined Satisfaction Index
    # Satisfaction = 0.35*Rating + 0.25*Engagement + 0.25*Retention + 0.15*Conversion
    avg_actions_per_active = (total_practices + total_tests) / max(1, active_users_7d)
    explicit_rating_score = (float(avg_rating) / 5.0) * 100 if avg_rating > 0 else 0.0
    engagement_score = min(100.0, (avg_actions_per_active / 15.0) * 100.0) # Target 15 actions/week
    
    satisfaction_index = round(
        (explicit_rating_score * 0.35) + 
        (engagement_score * 0.25) + 
        (retention_7d * 0.25) + 
        (conversion_rate * 0.15), 
        1
    )

    # 5. 30-Day Trends (Grouped SQL Queries)
    threshold_30d = (datetime.utcnow() - timedelta(days=30)).isoformat()[:10]
    
    # User growth by day (Registered only)
    user_growth_raw = db.execute(text("""
        SELECT LEFT(created_at, 10) as day, COUNT(*) as count 
        FROM users 
        WHERE created_at >= :t AND role != 'guest'
        GROUP BY LEFT(created_at, 10)
        ORDER BY day ASC
    """), {"t": threshold_30d}).fetchall()
    
    # Activity by day
    activity_raw = db.execute(text("""
        SELECT day, SUM(p_count) as practices, SUM(t_count) as tests FROM (
            SELECT LEFT(created_at, 10) as day, COUNT(*) as p_count, 0 as t_count 
            FROM practice_answers WHERE created_at >= :t GROUP BY LEFT(created_at, 10)
            UNION ALL
            SELECT LEFT(started_at, 10) as day, 0 as p_count, COUNT(*) as t_count 
            FROM test_sessions WHERE started_at >= :t GROUP BY LEFT(started_at, 10)
        ) as daily_activity
        GROUP BY day ORDER BY day ASC
    """), {"t": threshold_30d}).fetchall()

    # Fill gaps for 30 days to ensure smooth charts
    user_growth_trend = []
    activity_trend = []
    user_map = {r[0]: r[1] for r in user_growth_raw}
    act_map = {r[0]: (r[1], r[2]) for r in activity_raw}
    
    for i in range(29, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).date().isoformat()
        user_growth_trend.append({"date": d, "count": user_map.get(d, 0)})
        p, t = act_map.get(d, (0, 0))
        activity_trend.append({"date": d, "practices": p, "tests": t, "total": p + t})

    return {
        "stats": {
            "totalUsers": total_users,
            "totalPractices": total_practices,
            "totalTests": total_tests,
            "totalTrials": total_trials,
            "conversionRate": round(conversion_rate, 1),
            "avgDurationPerAnswer": round(float(avg_duration), 1),
            "avgSatisfaction": round(float(avg_rating), 1),
            "activeUsers7d": active_users_7d,
            "retention7dPercent": round(retention_7d, 1),
            "satisfactionIndex": satisfaction_index,
            "lowRatingCount": low_feedbacks
        },
        "trends": {
            "userGrowth": user_growth_trend,
            "activity": activity_trend
        },
        "logic": {
            "formula": "0.35*Rating + 0.25*Engagement + 0.25*Retention + 0.15*Conversion",
            "scores": {
                "rating": round(explicit_rating_score, 1),
                "engagement": round(engagement_score, 1),
                "retention": round(retention_7d, 1),
                "conversion": round(conversion_rate, 1)
            }
        }
    }

@router.get("/users", response_model=List[UserSchema])
def list_users(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """List all registered users with their token balances."""
    check_admin(admin_user)
    
    from app.models.sqlalchemy_models import UserTokenWallet
    
    # Query registered users (non-guests) and join with wallet to get token_balance
    results = db.query(User, UserTokenWallet.token_balance).\
        outerjoin(UserTokenWallet, User.id == UserTokenWallet.user_id).\
        filter(User.role != "guest").all()
    
    users = []
    from dateutil import parser as date_parser
    for user_obj, token_balance in results:
        # Map the token_balance back to the user object dynamically for the schema
        user_obj.token_balance = token_balance or 0
        user_obj.day_streak = user_obj.day_streak or 0
        user_obj.estimated_band = float(user_obj.estimated_band or 0.0)
        user_obj.role = user_obj.role or "user"
        user_obj.status = user_obj.status or "active"
        
        # Format created_at for frontend
        if user_obj.created_at:
            try:
                dt_obj = date_parser.parse(user_obj.created_at)
                user_obj.created_at = dt_obj.isoformat()
            except:
                pass
        
        users.append(user_obj)
        
    return users

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
    results = (
        db.query(SubscriptionRequest, User.email)
        .join(User, SubscriptionRequest.user_id == User.id)
        .filter(SubscriptionRequest.status == "pending")
        .order_by(SubscriptionRequest.created_at.desc())
        .all()
    )
    
    rows = []
    for req, email in results:
        rows.append({
            "id": req.id,
            "user_id": req.user_id,
            "user_email": email,
            "plan_code": req.plan_code,
            "amount_vnd": req.amount_vnd,
            "transfer_ref": req.transfer_ref,
            "duration_months": req.duration_months,
            "status": req.status,
            "created_at": req.created_at
        })
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

    # Set expiration date
    duration = req.duration_months or 1
    # If already has a future expiration date, extend it, otherwise start from now
    current_expiry = TokenService._parse_dt(wallet.expires_at)
    base_date = current_expiry if (current_expiry and current_expiry > TokenService._now()) else TokenService._now()
    # Approx 30 days per month
    new_expiry = base_date + timedelta(days=30 * duration)
    wallet.expires_at = new_expiry.isoformat()

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
@router.get("/users/{user_id}/detail")
def get_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Get comprehensive detail for a specific user."""
    check_admin(admin_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get wallet
    wallet = TokenService.get_or_create_wallet(db, user)
    
    # Get subscription history
    sub_requests = (
        db.query(SubscriptionRequest)
        .filter(SubscriptionRequest.user_id == user_id)
        .order_by(SubscriptionRequest.created_at.desc())
        .all()
    )
    
    # Aggregated stats
    practice_count = db.query(PracticeAnswer).join(PracticeSession).filter(PracticeSession.user_id == user_id).count()
    test_count = db.query(TestSession).filter(TestSession.user_id == user_id).count()
    
    avg_band = db.query(func.avg(TestSession.overall_band)).filter(TestSession.user_id == user_id).scalar() or 0
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
            "estimated_band": float(user.estimated_band or 0),
            "day_streak": user.day_streak
        },
        "wallet": {
            "plan_code": wallet.plan_code,
            "token_balance": wallet.token_balance,
            "monthly_token_used": wallet.monthly_token_used,
            "monthly_token_limit": wallet.monthly_token_limit,
            "lifetime_token_used": wallet.lifetime_token_used,
            "last_reset": wallet.last_token_reset_at
        },
        "stats": {
            "total_practices": practice_count,
            "total_tests": test_count,
            "avg_test_band": round(float(avg_band), 1)
        },
        "subscription_history": sub_requests
    }


@router.post("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Admin can activate or suspend a user account."""
    check_admin(admin_user)
    new_status = payload.get("status")
    if new_status not in ["active", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = new_status
    db.commit()
    return {"message": f"User status updated to {new_status}", "user_id": user_id, "status": new_status}


@router.post("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Admin can change a user's role (admin/user)."""
    check_admin(admin_user)
    new_role = payload.get("role")
    if new_role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = new_role
    db.commit()
    return {"message": f"User role updated to {new_role}", "user_id": user_id, "role": new_role}


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
        "test_start_cost", "daily_trial_bonus", "price_vnd", 
        "price_3m", "price_6m", "price_12m", "bank_account_info"
    }
    for k, v in payload.items():
        if k in allowed_fields and v is not None:
            setattr(row, k, v)

    row.updated_at = datetime.utcnow().isoformat()
    db.commit()
    return {"message": "Plan updated", "plan": {"code": plan_code, **TokenService.get_effective_plan(db, plan_code)}}


@router.post("/tokens/allocate")
def allocate_tokens(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Admin manually grants tokens to a user."""
    check_admin(admin_user)
    
    target_email = payload.get("email")
    amount = payload.get("amount")
    reason = payload.get("reason", "Manual allocation")
    
    if not target_email or not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Email and positive amount required")
    
    # Find user
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update wallet
    wallet = TokenService.get_or_create_wallet(db, user)
    wallet.token_balance = (wallet.token_balance or 0) + amount
    
    # Create audit record
    from app.models.sqlalchemy_models import TokenAllocation
    admin_id = admin_user.get("id") if isinstance(admin_user, dict) else admin_user.id
    allocation = TokenAllocation(
        admin_id=admin_id,
        user_id=user.id,
        amount=amount,
        reason=reason,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(allocation)
    db.commit()
    
    return {
        "message": f"Allocated {amount} tokens to {target_email}",
        "new_balance": wallet.token_balance
    }


@router.get("/tokens/history")
def get_token_allocation_history(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Get history of all manual token allocations."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import TokenAllocation
    
    rows = (
        db.query(TokenAllocation)
        .order_by(TokenAllocation.created_at.desc())
        .limit(100)
        .all()
    )
    
    result = []
    from dateutil import parser as date_parser
    for r in rows:
        # Safely parse the DB date string
        try:
            dt_str = r.created_at
            if dt_str:
                dt_obj = date_parser.parse(dt_str)
                iso_date = dt_obj.isoformat()
            else:
                iso_date = None
        except:
            iso_date = r.created_at

        result.append({
            "id": r.id,
            "admin_email": db.query(User.email).filter(User.id == r.admin_id).scalar(),
            "recipient_email": db.query(User.email).filter(User.id == r.user_id).scalar(),
            "amount": r.amount,
            "reason": r.reason,
            "created_at": iso_date
        })
        
    return result


# ============ EXAM SET MANAGEMENT ============

@router.get("/exam-sets")
def list_exam_sets(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """List all exam sets for admin management."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import ExamSet, Question
    import json
    
    sets = db.query(ExamSet).order_by(ExamSet.name).all()
    result = []
    for es in sets:
        try:
            q_ids = json.loads(es.question_ids_json)
        except:
            q_ids = {"part1": [], "part2": [], "part3": []}
        
        # Resolve question texts for preview
        questions_preview = {}
        for part_key in ["part1", "part2", "part3"]:
            ids = q_ids.get(part_key, [])
            questions = []
            for qid in ids:
                q = db.query(Question).filter(Question.id == qid).first()
                if q:
                    questions.append({"id": q.id, "text": q.question_text, "part": q.part})
            questions_preview[part_key] = questions
        
        result.append({
            "id": es.id,
            "name": es.name,
            "description": es.description,
            "estimated_minutes": es.estimated_minutes,
            "difficulty": es.difficulty,
            "is_active": es.is_active,
            "tag": es.tag,
            "question_ids_json": es.question_ids_json,
            "questions_preview": questions_preview,
            "question_counts": {
                "part1": len(q_ids.get("part1", [])),
                "part2": len(q_ids.get("part2", [])),
                "part3": len(q_ids.get("part3", [])),
            },
            "created_at": es.created_at
        })
    
    return result


@router.post("/exam-sets")
def create_exam_set(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Create a new exam set."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import ExamSet
    import json
    
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    question_ids = payload.get("question_ids", {"part1": [], "part2": [], "part3": []})
    
    exam_set = ExamSet(
        name=name,
        description=payload.get("description", ""),
        question_ids_json=json.dumps(question_ids),
        estimated_minutes=payload.get("estimated_minutes", 14),
        difficulty=payload.get("difficulty", "medium"),
        is_active=payload.get("is_active", True),
        tag=payload.get("tag")
    )
    db.add(exam_set)
    db.commit()
    db.refresh(exam_set)
    
    return {"message": "Exam set created", "id": exam_set.id, "name": exam_set.name}


@router.put("/exam-sets/{exam_set_id}")
def update_exam_set(
    exam_set_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Update an existing exam set."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import ExamSet
    import json
    
    es = db.query(ExamSet).filter(ExamSet.id == exam_set_id).first()
    if not es:
        raise HTTPException(status_code=404, detail="Exam set not found")
    
    allowed = {"name", "description", "estimated_minutes", "difficulty", "is_active", "tag"}
    for k, v in payload.items():
        if k in allowed and v is not None:
            setattr(es, k, v)
    
    if "question_ids" in payload:
        es.question_ids_json = json.dumps(payload["question_ids"])
    
    db.commit()
    return {"message": "Exam set updated", "id": es.id}


@router.delete("/exam-sets/{exam_set_id}")
def delete_exam_set(
    exam_set_id: str,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Delete an exam set."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import ExamSet
    
    es = db.query(ExamSet).filter(ExamSet.id == exam_set_id).first()
    if not es:
        raise HTTPException(status_code=404, detail="Exam set not found")
    
    db.delete(es)
    db.commit()
    return {"message": "Exam set deleted", "id": exam_set_id}


@router.get("/questions/bank")
def get_question_bank(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Get all questions in the bank for admin to pick from when building exam sets."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import Question, Topic
    
    questions = db.query(Question).order_by(Question.part, Question.id).all()
    result = []
    for q in questions:
        topic_name = q.topic.name if q.topic else None
        result.append({
            "id": q.id,
            "part": q.part,
            "question_text": q.question_text,
            "topic": topic_name,
            "cue_card_json": q.cue_card_json
        })
    return result


@router.post("/questions/bank/batch")
def batch_add_to_bank(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Add multiple questions to the bank at once."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import Question
    
    questions_texts = payload.get("questions", [])
    part = payload.get("part")
    topic_id = payload.get("topic_id")
    
    if not questions_texts or not part:
        raise HTTPException(status_code=400, detail="Missing questions or part")
    
    added_count = 0
    for text in questions_texts:
        if not text.strip():
            continue
        q = Question(
            question_text=text.strip(),
            part=part,
            topic_id=topic_id
        )
        db.add(q)
        added_count += 1
    
    db.commit()
    return {"message": f"Successfully added {added_count} questions", "count": added_count}


@router.post("/questions/bank")
def add_to_bank(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Add a new question to the bank."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import Question
    
    q = Question(
        question_text=payload["question_text"],
        part=payload["part"],
        topic_id=payload.get("topic_id"),
        model_answer=payload.get("model_answer"),
        cue_card_json=payload.get("cue_card_json")
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"message": "Question added", "id": q.id}


@router.put("/questions/bank/{q_id}")
def update_bank_question(
    q_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Update a question in the bank."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import Question
    
    q = db.query(Question).filter(Question.id == q_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    allowed = {"question_text", "part", "topic_id", "model_answer", "cue_card_json"}
    for k, v in payload.items():
        if k in allowed and v is not None:
            setattr(q, k, v)
    
    db.commit()
    return {"message": "Question updated", "id": q.id}


@router.delete("/questions/bank/{q_id}")
def delete_bank_question(
    q_id: str,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Delete a question from the bank."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import Question
    
    q = db.query(Question).filter(Question.id == q_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(q)
    db.commit()
    return {"message": "Question deleted", "id": q_id}


@router.get("/topics")
def get_topics(
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_user)
):
    """Get all topics for question categorization."""
    check_admin(admin_user)
    from app.models.sqlalchemy_models import Topic
    topics = db.query(Topic).order_by(Topic.part, Topic.name).all()
    return topics

