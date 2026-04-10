from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routes.auth_routes import get_current_user
from app.models.sqlalchemy_models import User, PracticeAnswer, PracticeSession
from app.services.blob_service import BlobService

router = APIRouter(prefix="/audio", tags=["audio"])
blob_service = BlobService()

@router.get("/{answer_id}")
def get_audio_playback_url(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a signed URL for audio playback."""
    # Find the answer and ensure it belongs to the current user via session
    answer = db.query(PracticeAnswer).filter(PracticeAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Check session ownership
    session = db.query(PracticeSession).filter(
        PracticeSession.id == answer.session_id,
        PracticeSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not answer.audio_blob_url:
        raise HTTPException(status_code=404, detail="Audio recording not found")
        
    # Generate SAS token URL
    signed_url = blob_service.get_signed_url(answer.audio_blob_url)
    if not signed_url:
        raise HTTPException(status_code=500, detail="Failed to generate playback URL")
        
    return {"url": signed_url}
