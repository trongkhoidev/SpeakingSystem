"""Billing, plans, and token usage routes."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sqlalchemy_models import User, SubscriptionRequest
from app.routes.auth_routes import get_current_user
from app.services.token_service import PLAN_DEFS, TokenService

router = APIRouter(prefix="/billing", tags=["billing"])


def _require_real_user(current_user: Any) -> User:
    if isinstance(current_user, dict):
        raise HTTPException(status_code=403, detail="Guest cannot access billing. Please sign in with Google.")
    return current_user


@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    TokenService.ensure_plan_rows(db)
    plans = []
    for code in PLAN_DEFS.keys():
        plan = TokenService.get_effective_plan(db, code)
        plans.append({
            "code": code,
            "name": plan["name"],
            "monthly_tokens": plan["monthly_tokens"],
            "practice_cost": plan["practice_cost"],
            "test_start_cost": plan["test_start_cost"],
            "daily_trial_bonus": plan["daily_trial_bonus"],
            "price_vnd": plan["price_vnd"],
            "price_3m": plan.get("price_3m"),
            "price_6m": plan.get("price_6m"),
            "price_12m": plan.get("price_12m"),
        })
    return {"plans": plans}


@router.get("/usage")
def get_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = _require_real_user(current_user)
    TokenService.ensure_user_plan_initialized(db, user)
    TokenService.maybe_reset_monthly_quota(db, user)
    user._token_wallet = TokenService.get_or_create_wallet(db, user)
    user._effective_plan = TokenService.get_effective_plan(db, user._token_wallet.plan_code)
    return TokenService.get_user_usage(user)


@router.post("/claim-daily")
def claim_daily_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = _require_real_user(current_user)
    TokenService.ensure_user_plan_initialized(db, user)
    added = TokenService.claim_daily_trial_tokens(db, user)
    user._token_wallet = TokenService.get_or_create_wallet(db, user)
    user._effective_plan = TokenService.get_effective_plan(db, user._token_wallet.plan_code)
    return {
        "added_tokens": added,
        "usage": TokenService.get_user_usage(user),
    }


@router.post("/reward-follow/{platform}")
def reward_follow(
    platform: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = _require_real_user(current_user)
    TokenService.ensure_user_plan_initialized(db, user)
    added = TokenService.reward_social_follow(db, user, platform)
    user._token_wallet = TokenService.get_or_create_wallet(db, user)
    user._effective_plan = TokenService.get_effective_plan(db, user._token_wallet.plan_code)
    return {
        "added_tokens": added,
        "platform": platform,
        "usage": TokenService.get_user_usage(user),
    }


@router.post("/subscribe/{plan_code}")
def request_subscribe_plan(
    plan_code: str,
    transfer_ref: str | None = None,
    note: str | None = None,
    duration_months: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = _require_real_user(current_user)
    if plan_code not in PLAN_DEFS:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan = TokenService.get_effective_plan(db, plan_code)
    
    # Calculate amount based on duration and custom prices
    if duration_months == 12:
        amount = plan.get("price_12m") or (plan["price_vnd"] * 12)
    elif duration_months == 6:
        amount = plan.get("price_6m") or (plan["price_vnd"] * 6)
    elif duration_months == 3:
        amount = plan.get("price_3m") or (plan["price_vnd"] * 3)
    else:
        amount = plan["price_vnd"] * duration_months

    req = SubscriptionRequest(
        user_id=user.id,
        plan_code=plan_code,
        amount_vnd=int(amount),
        transfer_ref=transfer_ref,
        duration_months=duration_months,
        note=note,
        status="pending",
    )
    db.add(req)
    db.commit()
    return {
        "message": "Subscription request submitted and waiting for admin confirmation.",
        "request_id": req.id,
        "plan_code": plan_code,
        "amount_vnd": int(amount),
        "duration_months": duration_months,
        "status": "pending",
    }
