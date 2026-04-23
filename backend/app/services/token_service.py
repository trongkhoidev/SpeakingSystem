"""Token quota and plan service."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.sqlalchemy_models import User, UserTokenWallet, BillingPlan


PLAN_DEFS: Dict[str, Dict[str, Any]] = {
    "free": {
        "name": "Free Starter",
        "monthly_tokens": 200,
        "practice_cost": 10,
        "test_start_cost": 35,
        "daily_trial_bonus": 15,
        "price_vnd": 0,
    },
    "basic": {
        "name": "Basic",
        "monthly_tokens": 1200,
        "practice_cost": 9,
        "test_start_cost": 30,
        "daily_trial_bonus": 20,
        "price_vnd": 69000,
    },
    "plus": {
        "name": "Plus",
        "monthly_tokens": 4000,
        "practice_cost": 8,
        "test_start_cost": 25,
        "daily_trial_bonus": 25,
        "price_vnd": 149000,
    },
}

SOCIAL_REWARD_TOKENS = 40


@dataclass
class TokenCheckResult:
    allowed: bool
    remaining: int
    required: int
    reason: str | None = None


class TokenService:
    @staticmethod
    def _plan_from_row(row: BillingPlan) -> Dict[str, Any]:
        return {
            "name": row.name,
            "monthly_tokens": int(row.monthly_tokens),
            "practice_cost": int(row.practice_cost),
            "test_start_cost": int(row.test_start_cost),
            "daily_trial_bonus": int(row.daily_trial_bonus),
            "price_vnd": int(row.price_vnd),
        }

    @staticmethod
    def ensure_plan_rows(db: Session) -> None:
        changed = False
        for code, plan in PLAN_DEFS.items():
            row = db.query(BillingPlan).filter(BillingPlan.code == code).first()
            if not row:
                db.add(BillingPlan(
                    code=code,
                    name=plan["name"],
                    monthly_tokens=int(plan["monthly_tokens"]),
                    practice_cost=int(plan["practice_cost"]),
                    test_start_cost=int(plan["test_start_cost"]),
                    daily_trial_bonus=int(plan["daily_trial_bonus"]),
                    price_vnd=int(plan["price_vnd"]),
                ))
                changed = True
        if changed:
            db.commit()

    @staticmethod
    def _now() -> datetime:
        return datetime.utcnow()

    @staticmethod
    def _parse_dt(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    @staticmethod
    def _today_key(now: datetime) -> str:
        return now.strftime("%Y-%m-%d")

    @staticmethod
    def _month_key(now: datetime) -> str:
        return now.strftime("%Y-%m")

    @staticmethod
    def get_plan(plan_code: str | None) -> Dict[str, Any]:
        return PLAN_DEFS.get(plan_code or "free", PLAN_DEFS["free"])

    @staticmethod
    def get_effective_plan(db: Session, plan_code: str | None) -> Dict[str, Any]:
        TokenService.ensure_plan_rows(db)
        code = plan_code or "free"
        row = db.query(BillingPlan).filter(BillingPlan.code == code).first()
        if row:
            return TokenService._plan_from_row(row)
        return TokenService.get_plan(code)

    @staticmethod
    def get_or_create_wallet(db: Session, user: User) -> UserTokenWallet:
        wallet = db.query(UserTokenWallet).filter(UserTokenWallet.user_id == user.id).first()
        if wallet:
            return wallet
        plan = TokenService.get_effective_plan(db, "free")
        wallet = UserTokenWallet(
            user_id=user.id,
            plan_code="free",
            token_balance=int(plan["monthly_tokens"]),
            monthly_token_limit=int(plan["monthly_tokens"]),
            last_token_reset_at=TokenService._month_key(TokenService._now()),
        )
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
        return wallet

    @staticmethod
    def ensure_user_plan_initialized(db: Session, user: User) -> None:
        wallet = TokenService.get_or_create_wallet(db, user)
        plan = TokenService.get_effective_plan(db, wallet.plan_code)
        changed = False
        if not wallet.plan_code:
            wallet.plan_code = "free"
            changed = True
        if wallet.monthly_token_limit is None or wallet.monthly_token_limit <= 0:
            wallet.monthly_token_limit = int(plan["monthly_tokens"])
            changed = True
        if wallet.token_balance is None:
            wallet.token_balance = int(plan["monthly_tokens"])
            changed = True
        if wallet.last_token_reset_at is None:
            wallet.last_token_reset_at = TokenService._month_key(TokenService._now())
            changed = True
        if changed:
            db.commit()

    @staticmethod
    def maybe_reset_monthly_quota(db: Session, user: User) -> None:
        wallet = TokenService.get_or_create_wallet(db, user)
        now = TokenService._now()
        current_month = TokenService._month_key(now)
        last_month = wallet.last_token_reset_at
        if last_month != current_month:
            plan = TokenService.get_effective_plan(db, wallet.plan_code)
            wallet.monthly_token_limit = int(plan["monthly_tokens"])
            wallet.token_balance = int(plan["monthly_tokens"])
            wallet.monthly_token_used = 0
            wallet.last_token_reset_at = current_month
            db.commit()

    @staticmethod
    def claim_daily_trial_tokens(db: Session, user: User) -> int:
        wallet = TokenService.get_or_create_wallet(db, user)
        plan = TokenService.get_effective_plan(db, wallet.plan_code)
        today = TokenService._today_key(TokenService._now())
        if wallet.daily_trial_claimed_at == today:
            return 0
        bonus = int(plan["daily_trial_bonus"])
        wallet.token_balance = int(wallet.token_balance or 0) + bonus
        wallet.daily_trial_claimed_at = today
        db.commit()
        return bonus

    @staticmethod
    def check_can_consume(db: Session, user: User, required_tokens: int) -> TokenCheckResult:
        TokenService.ensure_user_plan_initialized(db, user)
        TokenService.maybe_reset_monthly_quota(db, user)
        wallet = TokenService.get_or_create_wallet(db, user)
        remaining = int(wallet.token_balance or 0)
        if remaining < required_tokens:
            return TokenCheckResult(
                allowed=False,
                remaining=remaining,
                required=required_tokens,
                reason="insufficient_tokens",
            )
        return TokenCheckResult(allowed=True, remaining=remaining, required=required_tokens)

    @staticmethod
    def consume_tokens(db: Session, user: User, amount: int) -> None:
        check = TokenService.check_can_consume(db, user, amount)
        if not check.allowed:
            raise HTTPException(
                status_code=402,
                detail=(
                    f"Insufficient tokens ({check.remaining} left, need {check.required}). "
                    "Please upgrade plan or claim daily trial tokens."
                ),
            )
        wallet = TokenService.get_or_create_wallet(db, user)
        wallet.token_balance = int(wallet.token_balance or 0) - amount
        wallet.monthly_token_used = int(wallet.monthly_token_used or 0) + amount
        wallet.lifetime_token_used = int(wallet.lifetime_token_used or 0) + amount
        db.commit()

    @staticmethod
    def reward_social_follow(db: Session, user: User, platform: str) -> int:
        wallet = TokenService.get_or_create_wallet(db, user)
        platform = platform.lower()
        if platform not in {"facebook", "x"}:
            raise HTTPException(status_code=400, detail="Unsupported platform")
        rewarded_attr = "facebook_rewarded" if platform == "facebook" else "x_rewarded"
        if getattr(wallet, rewarded_attr):
            return 0
        setattr(wallet, rewarded_attr, True)
        wallet.token_balance = int(wallet.token_balance or 0) + SOCIAL_REWARD_TOKENS
        db.commit()
        return SOCIAL_REWARD_TOKENS

    @staticmethod
    def get_user_usage(user: User) -> Dict[str, Any]:
        wallet = getattr(user, "_token_wallet", None)
        if wallet is None:
            raise HTTPException(status_code=500, detail="Wallet not loaded")
        plan = getattr(user, "_effective_plan", None)
        if plan is None:
            raise HTTPException(status_code=500, detail="Plan not loaded")
        return {
            "plan_code": wallet.plan_code,
            "plan_name": plan["name"],
            "price_vnd": plan["price_vnd"],
            "token_balance": int(wallet.token_balance or 0),
            "monthly_token_used": int(wallet.monthly_token_used or 0),
            "monthly_token_limit": int(wallet.monthly_token_limit or plan["monthly_tokens"]),
            "lifetime_token_used": int(wallet.lifetime_token_used or 0),
            "costs": {
                "practice": int(plan["practice_cost"]),
                "test_start": int(plan["test_start_cost"]),
            },
            "daily_trial_bonus": int(plan["daily_trial_bonus"]),
            "social_reward_tokens": SOCIAL_REWARD_TOKENS,
            "facebook_rewarded": bool(wallet.facebook_rewarded),
            "x_rewarded": bool(wallet.x_rewarded),
        }
