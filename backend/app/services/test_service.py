"""Test session management service."""

from sqlalchemy.orm import Session
from app.models.sqlalchemy_models import TestSession, TestAnswer, Question
from app.models.schemas import TestSessionCreate
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import func
from app.services.scoring_service import ScoringService


class TestService:
    @staticmethod
    def create_session(db: Session, user_id: str, config: TestSessionCreate) -> TestSession:
        """Create a new test session."""
        session = TestSession(
            user_id=user_id,
            examiner_voice=config.examiner_voice,
            question_count=config.question_count,
            follow_up_enabled=config.follow_up_enabled,
            parts_included=config.parts_included,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_test_questions(db: Session, config: TestSessionCreate) -> List[Question]:
        """Get questions for a test based on config."""
        question_count = config.question_count or 5
        parts = config.parts_included
        
        # If no specific parts, do full test
        if not parts:
            p1 = db.query(Question).filter(Question.part == 1).order_by(func.random()).limit(question_count).all()
            p2 = db.query(Question).filter(Question.part == 2).order_by(func.random()).limit(1).all()
            p3 = db.query(Question).filter(Question.part == 3).order_by(func.random()).limit(question_count).all()
            return p1 + p2 + p3
        
        # Single part
        return db.query(Question).filter(Question.part == parts).order_by(func.random()).limit(question_count).all()

    @staticmethod
    def complete_session(db: Session, session_id: str) -> Optional[TestSession]:
        """Mark a test session as complete and calculate overall score."""
        session = db.query(TestSession).filter(TestSession.id == session_id).first()
        if not session:
            return None
        
        answers = db.query(TestAnswer).filter(TestAnswer.test_session_id == session_id).all()
        if answers:
            valid_answers = [a for a in answers if a.overall_band is not None]
            if valid_answers:
                total_band = sum(float(a.overall_band) for a in valid_answers)
                average_band = total_band / len(valid_answers)
                session.overall_band = ScoringService._round_ielts(average_band)
        
        session.completed_at = datetime.utcnow().isoformat()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_session_report(db: Session, session_id: str):
        """Build a detailed test report."""
        session = db.query(TestSession).filter(TestSession.id == session_id).first()
        if not session:
            return None
        
        answers = db.query(TestAnswer).filter(TestAnswer.test_session_id == session_id).all()
        
        results = []
        for answer in answers:
            results.append({
                "id": answer.id,
                "question": answer.question.question_text if answer.question else "N/A",
                "part": answer.part_number or (answer.question.part if answer.question else None),
                "overall_band": float(answer.overall_band) if answer.overall_band else None,
                "feedback": answer.llm_result
            })
            
        return {
            "id": session.id,
            "date": str(session.started_at),
            "overallBand": float(session.overall_band) if session.overall_band else None,
            "type": "Full Test",
            "results": results
        }

    @staticmethod
    def get_user_test_history(db: Session, user_id: str):
        """Get completed test sessions for a user."""
        return db.query(TestSession).filter(
            TestSession.user_id == user_id,
            TestSession.completed_at.isnot(None)
        ).order_by(TestSession.started_at.desc()).all()
