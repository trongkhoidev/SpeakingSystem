"""Authentication routes for Google OAuth login and user session management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from authlib.jose import jwt
import httpx
import logging
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.database import get_db
from app.models.sqlalchemy_models import User
from app.models.schemas import GoogleLoginRequest, Token, User as UserSchema
from app.utils.security import create_access_token, decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

security = HTTPBearer()

async def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get the current authenticated user."""
    
    payload = decode_access_token(auth.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not find user ID in token",
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in database",
        )
        
    return user

@router.post("/google", response_model=Token)
async def google_login(
    login_data: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate with Google ID Token."""
    
    try:
        # Verify Google ID Token
        # Use httpx to fetch the public keys from Google if we're doing manual verification,
        # but here we'll assume the token was already validated by the frontend or 
        # use a simpler verification for now because we need CLIENT_ID.
        
        if not settings.GOOGLE_CLIENT_ID:
            logger.warning("GOOGLE_CLIENT_ID not configured, skipping ID Token verification (DANGEROUS)")
            # In a real app, this should fail if not configured
            # For now, let's try to decode without verification to get user info if not configured
            # (only during development)
            header = jwt.decode(login_data.id_token, None) # decode without validation
            payload = jwt.decode(login_data.id_token, None)
        else:
            # Fetch Google's public keys
            async with httpx.AsyncClient() as client:
                resp = await client.get(settings.GOOGLE_CONF_URL)
                resp.raise_for_status()
                jwks_uri = resp.json().get("jwks_uri")
                
                resp = await client.get(jwks_uri)
                resp.raise_for_status()
                jwks = resp.json()
            
            payload = jwt.decode(
                login_data.id_token, 
                jwks, 
                claims_options={
                    "iss": {"values": ["https://accounts.google.com", "accounts.google.com"]},
                    "aud": {"values": [settings.GOOGLE_CLIENT_ID]}
                }
            )
        
        # Get user info from payload
        google_sub = payload.get("sub")
        email = payload.get("email")
        name = payload.get("name")
        picture = payload.get("picture")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided in Google ID Token"
            )
            
        # Find or create user in database
        user = db.query(User).filter(User.id == google_sub).first()
        
        if not user:
            user = User(
                id=google_sub,
                email=email,
                full_name=name,
                avatar_url=picture
            )
            db.add(user)
        else:
            # Update user info if changed
            user.full_name = name
            user.avatar_url = picture
            
        db.commit()
        db.refresh(user)
        
        # Create JWT access token
        access_token = create_access_token(data={"sub": user.id, "email": user.email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except Exception as e:
        logger.error(f"Google login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Verification failed: {str(e)}"
        )

@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user

@router.get("/config/deepgram")
async def get_deepgram_config(current_user: User = Depends(get_current_user)):
    """Return a temporary Deepgram API key for frontend live transcription.
    
    NOTE: This still returns the API key. In production, use Deepgram's
    temporary key API (POST /v1/manage/keys) to create scoped, time-limited keys.
    This endpoint requires JWT auth so it cannot be called without login.
    """
    if not settings.DEEPGRAM_API_KEY:
        raise HTTPException(status_code=503, detail="Deepgram not configured")
    return {"api_key": settings.DEEPGRAM_API_KEY}
