"""Test session management service."""

from sqlalchemy.orm import Session
from app.models.sqlalchemy_models import TestSession, TestAnswer, Question, ExamSet, Topic
from app.models.schemas import TestSessionCreate
import uuid
import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy import func, text
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
        
        # Scenario 1: Using a specific Exam Set
        if config.exam_set_id:
            exam_set = db.query(ExamSet).filter(ExamSet.id == config.exam_set_id).first()
            if exam_set:
                try:
                    q_ids_dict = json.loads(exam_set.question_ids_json)
                    # Merge all part lists into one sequential list
                    all_ids = []
                    for part in ['part1', 'part2', 'part3']:
                        if part in q_ids_dict:
                            all_ids.extend(q_ids_dict[part])
                    
                    # Fetch questions in order
                    questions = []
                    for q_id in all_ids:
                        q = db.query(Question).filter(Question.id == q_id).first()
                        if q:
                            questions.append(q)
                    return questions
                except Exception as e:
                    print(f"Error parsing exam set questions: {e}")

        # Scenario 2: Random / Custom selection
        question_count = config.question_count or 5
        parts = config.parts_included
        
        # If no specific parts, do full test (Smart Random: Cluster P1 + P2 + Linked/Topic P3)
        if not parts:
            # 1. Pick 1 random Part 1 Topic cluster
            p1_topic = db.query(Topic).filter(Topic.part == 1).order_by(text('NEWID()')).first()
            p1 = []
            if p1_topic:
                p1 = db.query(Question).filter(Question.topic_id == p1_topic.id).all()
            
            if not p1:
                p1 = db.query(Question).filter(Question.part == 1).order_by(text('NEWID()')).limit(4).all()

            # 2. Pick 1 random Part 2 cue card
            p2 = db.query(Question).filter(Question.part == 2).order_by(text('NEWID()')).limit(1).all()
            
            p3 = []
            if p2:
                # 3. Smart Fallback for Part 3
                # Attempt 1: Explicitly linked
                p3 = db.query(Question).filter(Question.part == 3, Question.linked_part2_id == p2[0].id).all()
                
                # Attempt 2: Topic match fallback
                if len(p3) < 2:
                    p2_topic = p2[0].topic
                    if p2_topic:
                        # Try to find a Part 3 Topic with a similar name
                        p3_topic = db.query(Topic).filter(Topic.part == 3, Topic.name == p2_topic.name).first()
                        if p3_topic:
                            p3 = db.query(Question).filter(Question.topic_id == p3_topic.id).all()
            
            # Final Fallback: Pure random Part 3
            if len(p3) < 2:
                remaining = 4 - len(p3)
                if remaining > 0:
                    fallback_p3 = db.query(Question).filter(Question.part == 3).order_by(text('NEWID()')).limit(remaining).all()
                    p3.extend(fallback_p3)
                
            return p1 + p2 + p3
        
        # Single part
        return db.query(Question).filter(Question.part == parts).order_by(text('NEWID()')).limit(question_count).all()

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
            # Parse the raw JSON text stored in llm_result
            try:
                import json as _json
                parsed_feedback = _json.loads(answer.llm_result) if answer.llm_result else None
            except (ValueError, TypeError):
                parsed_feedback = None

            results.append({
                "id": answer.id,
                "question": answer.question.question_text if answer.question else "N/A",
                "part": answer.part_number or (answer.question.part if answer.question else None),
                "overall_band": float(answer.overall_band) if answer.overall_band else None,
                "fc_band": float(answer.fc_band) if answer.fc_band else None,
                "lr_band": float(answer.lr_band) if answer.lr_band else None,
                "gra_band": float(answer.gra_band) if answer.gra_band else None,
                "pron_band": float(answer.pronunciation_band) if answer.pronunciation_band else None,
                "student_transcript": answer.student_transcript,
                "audio_url": answer.audio_blob_url,
                "word_details": _json.loads(answer.word_details) if answer.word_details else None,
                "azure_pronunciation": {
                    "accuracy_score": float(answer.accuracy_score) if answer.accuracy_score else None,
                    "fluency_score": float(answer.fluency_score) if answer.fluency_score else None,
                    "prosody_score": float(answer.prosody_score) if answer.prosody_score else None,
                },
                "feedback_json": parsed_feedback
            })

        # Derive a meaningful test type label from session config
        parts = session.parts_included
        if parts == 1:
            test_type = "Part 1"
        elif parts == 2:
            test_type = "Part 2"
        elif parts == 3:
            test_type = "Part 3"
        else:
            test_type = "Full Test"

        return {
            "id": session.id,
            "date": str(session.started_at),
            "overallBand": float(session.overall_band) if session.overall_band else None,
            "type": test_type,
            "results": results
        }

    @staticmethod
    def get_user_test_history(db: Session, user_id: str):
        """Get completed test sessions for a user."""
        return db.query(TestSession).filter(
            TestSession.user_id == user_id,
            TestSession.completed_at.isnot(None)
        ).order_by(TestSession.started_at.desc()).all()
