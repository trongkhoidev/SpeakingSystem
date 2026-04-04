from sqlalchemy.orm import Session
from app.models.sqlalchemy_models import TestSession, Question, Answer
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import func
from app.services.scoring_service import ScoringService

class TestService:
    @staticmethod
    def create_session(db: Session, user_id: str, mode: str, config: dict = None) -> TestSession:
        session = TestSession(
            user_id=user_id,
            mode=mode,
            config=config,
            is_completed=False
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_test_questions(db: Session, mode: str, config: dict = None) -> List[Question]:
        question_count = config.get("questionCount", 5) if config else 5
        
        if mode == "part1":
            return db.query(Question).filter(Question.part == 1).order_by(func.random()).limit(question_count).all()
        elif mode == "part2":
            return db.query(Question).filter(Question.part == 2).order_by(func.random()).limit(1).all()
        elif mode == "part3":
            return db.query(Question).filter(Question.part == 3).order_by(func.random()).limit(question_count).all()
        elif mode == "full":
            p1 = db.query(Question).filter(Question.part == 1).order_by(func.random()).limit(question_count).all()
            p2 = db.query(Question).filter(Question.part == 2).order_by(func.random()).limit(1).all()
            p3 = db.query(Question).filter(Question.part == 3).order_by(func.random()).limit(question_count).all()
            return p1 + p2 + p3
        return []

    @staticmethod
    def complete_session(db: Session, session_id: str) -> TestSession:
        session = db.query(TestSession).filter(TestSession.id == session_id).first()
        if not session:
            return None
        
        answers = db.query(Answer).filter(Answer.session_id == session_id).all()
        if answers:
            # Average the overall bands
            valid_answers = [a for a in answers if a.band_overall is not None]
            if valid_answers:
                total_band = sum(a.band_overall for a in valid_answers)
                average_band = total_band / len(valid_answers)
                session.overall_band = ScoringService._round_ielts(average_band)
        
        session.is_completed = True
        session.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_session_report(db: Session, session_id: str):
        session = db.query(TestSession).filter(TestSession.id == session_id).first()
        if not session:
            return None
        
        answers = db.query(Answer).options().filter(Answer.session_id == session_id).all()
        
        results = []
        for answer in answers:
            feedback = "No feedback available"
            if answer.feedback_json:
                if isinstance(answer.feedback_json, dict):
                    feedback = answer.feedback_json.get("general_feedback", "No feedback available")
                else:
                    feedback = str(answer.feedback_json)

            results.append({
                "id": answer.id,
                "question": answer.question.text,
                "part": answer.question.part,
                "overall_band": answer.band_overall,
                "scores": {
                    "fc": answer.band_fc,
                    "lr": answer.band_lr,
                    "gra": answer.band_gra,
                    "pron": answer.band_pron
                },
                "feedback": feedback
            })
            
        return {
            "id": session.id,
            "date": session.created_at.strftime("%Y-%m-%d"),
            "overallBand": session.overall_band,
            "type": session.mode.capitalize(),
            "results": results
        }

    @staticmethod
    def get_user_test_history(db: Session, user_id: str):
        return db.query(TestSession).filter(
            TestSession.user_id == user_id,
            TestSession.is_completed == True
        ).order_by(TestSession.created_at.desc()).all()
