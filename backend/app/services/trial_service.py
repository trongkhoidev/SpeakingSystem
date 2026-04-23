"""Trial service for managing guest usage limits."""

import logging
from sqlalchemy.orm import Session
from ..models.sqlalchemy_models import GuestTrial
from datetime import datetime

logger = logging.getLogger(__name__)

# Trial budget:
# - Practice answer costs 2 points
# - Mock test start costs 6 points
# - Guest has 12 points total
# This allows flexible combinations:
#   6 practice, or 2 tests, or 3 practice + 1 test, etc.
TOTAL_TRIAL_POINTS = 12
PRACTICE_COST = 2
TEST_COST = 6

class TrialService:
    @staticmethod
    def _used_points(trial: GuestTrial) -> int:
        return (trial.practice_count * PRACTICE_COST) + (trial.test_count * TEST_COST)

    @staticmethod
    def _remaining_points(trial: GuestTrial) -> int:
        return max(0, TOTAL_TRIAL_POINTS - TrialService._used_points(trial))

    @staticmethod
    def get_or_create_trial(db: Session, guest_id: str) -> GuestTrial:
        """Fetch or initialize a guest trial record."""
        trial = db.query(GuestTrial).filter(GuestTrial.guest_id == guest_id).first()
        if not trial:
            trial = GuestTrial(guest_id=guest_id)
            db.add(trial)
            db.commit()
            db.refresh(trial)
        return trial

    @staticmethod
    def can_practice(db: Session, guest_id: str) -> bool:
        """Check if guest can perform more practices."""
        trial = TrialService.get_or_create_trial(db, guest_id)
        return TrialService._remaining_points(trial) >= PRACTICE_COST

    @staticmethod
    def can_test(db: Session, guest_id: str) -> bool:
        """Check if guest can perform more mock tests."""
        trial = TrialService.get_or_create_trial(db, guest_id)
        return TrialService._remaining_points(trial) >= TEST_COST

    @staticmethod
    def increment_practice(db: Session, guest_id: str):
        """Increment practice count for guest."""
        trial = TrialService.get_or_create_trial(db, guest_id)
        trial.practice_count += 1
        trial.last_active = datetime.now().isoformat()
        db.commit()

    @staticmethod
    def increment_test(db: Session, guest_id: str):
        """Increment test count for guest."""
        trial = TrialService.get_or_create_trial(db, guest_id)
        trial.test_count += 1
        trial.last_active = datetime.now().isoformat()
        db.commit()

    @staticmethod
    def get_status(db: Session, guest_id: str):
        """Get guest trial status."""
        trial = TrialService.get_or_create_trial(db, guest_id)
        remaining_points = TrialService._remaining_points(trial)
        return {
            "guest_id": guest_id,
            "practice_count": trial.practice_count,
            "test_count": trial.test_count,
            "practice_remaining": remaining_points // PRACTICE_COST,
            "test_remaining": remaining_points // TEST_COST,
            "remaining_points": remaining_points,
            "total_points": TOTAL_TRIAL_POINTS,
            "costs": {
                "practice": PRACTICE_COST,
                "test": TEST_COST
            }
        }
