"""Utilities for Supabase database operations."""

from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Singleton Supabase client."""
    
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client."""
        
        if cls._instance is None:
            cls._instance = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("✓ Supabase client initialized")
        
        return cls._instance


async def save_assessment_result(
    user_id: str,
    question_id: str,
    assessment_data: dict,
) -> str:
    """
    Save assessment result to Supabase.
    
    Args:
        user_id: User database ID
        question_id: Question database ID
        assessment_data: Assessment result dictionary
    
    Returns:
        Assessment record ID
    """
    
    client = SupabaseClient.get_client()
    
    try:
        response = client.table("assessments").insert({
            "user_id": user_id,
            "question_id": question_id,
            "result": assessment_data,
            "created_at": "now()",
        }).execute()
        
        return response.data[0]["id"]
    
    except Exception as e:
        logger.error(f"Failed to save assessment: {str(e)}")
        raise


async def save_audio_recording(
    user_id: str,
    assessment_id: str,
    audio_bytes: bytes,
    filename: str,
) -> str:
    """
    Save audio recording to Supabase Storage.
    
    Args:
        user_id: User database ID
        assessment_id: Assessment ID
        audio_bytes: Raw audio data
        filename: Original filename
    
    Returns:
        Storage path
    """
    
    client = SupabaseClient.get_client()
    
    try:
        path = f"{user_id}/{assessment_id}/{filename}"
        
        response = client.storage.from_(
            settings.AUDIO_STORAGE_BUCKET
        ).upload(path, audio_bytes)
        
        return path
    
    except Exception as e:
        logger.error(f"Failed to save audio: {str(e)}")
        raise
