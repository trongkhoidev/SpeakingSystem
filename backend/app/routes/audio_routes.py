from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routes.auth_routes import get_current_user
from app.models.sqlalchemy_models import User, Answer
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
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
        
    if answer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not answer.audio_url:
        raise HTTPException(status_code=404, detail="Audio recording not found")
        
    # Generate SAS token URL
    signed_url = blob_service.get_signed_url(answer.audio_url)
    if not signed_url:
        raise HTTPException(status_code=500, detail="Failed to generate playback URL")
        
    return {"url": signed_url}
