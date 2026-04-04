"""Dashboard data aggregation service."""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, distinct
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from ..models.sqlalchemy_models import PracticeAnswer, PracticeSession, Question, Topic, User


class DashboardService:
    @staticmethod
    def get_streak(user_id: str, db: Session) -> int:
        """Calculate the current daily streak for a user."""
        activity_dates = db.query(
            func.date(PracticeAnswer.created_at).label('activity_date')
        ).join(
            PracticeSession, PracticeAnswer.session_id == PracticeSession.id
        ).filter(
            PracticeSession.user_id == user_id
        ).distinct().order_by(desc('activity_date')).all()
        
        if not activity_dates:
            return 0
            
        dates = [d[0] for d in activity_dates]
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        if dates[0] not in (today, yesterday):
            return 0
            
        streak = 1
        current_date = dates[0]
        
        for i in range(1, len(dates)):
            if dates[i] == current_date - timedelta(days=1):
                streak += 1
                current_date = dates[i]
            else:
                break
                
        return streak

    @staticmethod
    def get_daily_mission(user_id: str, db: Session) -> Dict[str, int]:
        """Get today's practice progress."""
        today = date.today()
        count = db.query(PracticeAnswer).join(
            PracticeSession, PracticeAnswer.session_id == PracticeSession.id
        ).filter(
            PracticeSession.user_id == user_id,
            func.date(PracticeAnswer.created_at) == today
        ).count()
        
        return {
            "completed": count,
            "total": 5
        }

    @staticmethod
    def get_band_estimate(user_id: str, db: Session) -> Dict[str, Any]:
        """Estimate band score based on last 10 answers."""
        recent_answers = db.query(PracticeAnswer.overall_band).join(
            PracticeSession, PracticeAnswer.session_id == PracticeSession.id
        ).filter(
            PracticeSession.user_id == user_id,
            PracticeAnswer.overall_band.isnot(None)
        ).order_by(desc(PracticeAnswer.created_at)).limit(20).all()
        
        if not recent_answers:
            return {"current": 0.0, "change": 0.0, "tips": []}
            
        current_scores = [float(a[0]) for a in recent_answers[:10]]
        avg_current = sum(current_scores) / len(current_scores)
        
        previous_scores = [float(a[0]) for a in recent_answers[10:20]]
        avg_prev = sum(previous_scores) / len(previous_scores) if previous_scores else avg_current
        
        change = avg_current - avg_prev
        
        tips = [
            {"title": "Phát âm (Pronunciation)", "content": "Hãy chú ý đến trọng âm của từ và ngữ điệu câu để tự nhiên hơn."},
            {"title": "Từ vựng (Lexical)", "content": "Thử sử dụng các từ đồng nghĩa thay vì lặp lại các từ cơ bản like, good, bad."},
            {"title": "Trôi chảy (Fluency)", "content": "Giảm bớt thời gian ngắt quãng bằng cách dùng các từ nối filler words."}
        ]
        
        from app.services.scoring_service import ScoringService
        
        return {
            "current": ScoringService._round_ielts(avg_current),
            "change": round(change, 1),
            "tips": tips
        }

    @staticmethod
    def get_forecast_progress(user_id: str, db: Session) -> List[Dict[str, Any]]:
        """Get progress per IELTS Part."""
        results = []
        parts = [1, 2, 3]
        colors = ["bg-primary", "bg-indigo-500", "bg-purple-600"]
        
        for idx, part in enumerate(parts):
            total_qs = db.query(Question).filter(Question.part == part).count()
            
            answered_qs = db.query(func.count(distinct(PracticeAnswer.question_id))).join(
                Question, PracticeAnswer.question_id == Question.id
            ).join(
                PracticeSession, PracticeAnswer.session_id == PracticeSession.id
            ).filter(
                PracticeSession.user_id == user_id,
                Question.part == part
            ).scalar() or 0
            
            results.append({
                "part": f"Part {part}",
                "completed": answered_qs,
                "total": total_qs if total_qs > 0 else 100,
                "color": colors[idx]
            })
            
        return results

    @staticmethod
    def get_heatmap_data(user_id: str, db: Session) -> List[Dict[str, Any]]:
        """Get activity heatmap for the last 5 months."""
        start_date = date.today() - timedelta(days=154)
        
        activity = db.query(
            func.date(PracticeAnswer.created_at).label('date'),
            func.count(PracticeAnswer.id).label('count')
        ).join(
            PracticeSession, PracticeAnswer.session_id == PracticeSession.id
        ).filter(
            PracticeSession.user_id == user_id,
            func.date(PracticeAnswer.created_at) >= start_date
        ).group_by(func.date(PracticeAnswer.created_at)).all()
        
        return [{"date": str(a.date), "count": a.count} for a in activity]
