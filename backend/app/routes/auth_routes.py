"""Authentication routes for Google OAuth login and user session management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
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

def _get_admin_email_set() -> set[str]:
    return {
        e.strip().lower()
        for e in (settings.ADMIN_EMAILS or "").split(",")
        if e.strip()
    }

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
    role = payload.get("role", "user")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not find user ID in token",
        )
        
    if role == "guest":
        # Return a mock user object for guests
        return {
            "id": user_id,
            "role": "guest",
            "email": "guest@trial.com",
            "full_name": "Guest User"
        }
        
    try:
        user = db.query(User).filter(User.id == user_id).first()
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable: cannot reach database.",
        )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in database",
        )

    # Token role has priority for request authorization (helps keep admin access stable)
    # when the login token was minted with admin role from env-matched email.
    if role == "admin":
        user.role = "admin"

    return user

@router.post("/google", response_model=Token)
async def google_login(
    login_data: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate with Google ID Token."""
    
    try:
        # Verify Google ID Token
        if not settings.GOOGLE_CLIENT_ID:
            if settings.DEBUG:
                logger.warning("GOOGLE_CLIENT_ID not configured, skipping ID Token verification (DANGEROUS)")
                # For development ONLY: decode without verification
                payload = jwt.decode(login_data.id_token, None)
            else:
                logger.error("GOOGLE_CLIENT_ID must be configured in production!")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Auth system misconfigured: Google Client ID missing"
                )
        else:
            # Fetch Google's public keys
            async with httpx.AsyncClient() as client:
                resp = await client.get(settings.GOOGLE_CONF_URL)
                resp.raise_for_status()
                jwks_uri = resp.json().get("jwks_uri")
                
                resp = await client.get(jwks_uri)
                resp.raise_for_status()
                jwks = resp.json()
            
            try:
                payload = jwt.decode(
                    login_data.id_token, 
                    jwks, 
                    claims_options={
                        "iss": {"values": ["https://accounts.google.com", "accounts.google.com"]},
                        "aud": {"values": [settings.GOOGLE_CLIENT_ID]}
                    }
                )
            except Exception as jwt_err:
                logger.error(f"JWT verification failed: {str(jwt_err)}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google ID Token"
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
        try:
            admin_email_set = _get_admin_email_set()
            is_env_admin = (email or "").lower() in admin_email_set

            user = db.query(User).filter(User.id == google_sub).first()
            
            if not user:
                user = User(
                    id=google_sub,
                    email=email,
                    full_name=name,
                    avatar_url=picture,
                    google_id=google_sub,
                    role="admin" if is_env_admin else "user"
                )
                db.add(user)
            else:
                # Update user info if changed
                user.full_name = name
                user.avatar_url = picture
                user.google_id = google_sub
                if is_env_admin and user.role != "admin":
                    user.role = "admin"
                
            db.commit()
            db.refresh(user)
        except Exception as db_err:
            logger.error(f"Database error during login: {str(db_err)}")
            if "not allowed to access the server" in str(db_err).lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database firewall is blocking this IP. Please add current public IP to Azure SQL firewall."
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_err)}"
            )
        
        # Create JWT access token
        token_role = "admin" if (email or "").lower() in _get_admin_email_set() else user.role
        access_token = create_access_token(data={
            "sub": user.id, 
            "email": user.email,
            "role": token_role
        })
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/guest", response_model=Token)
async def guest_login(db: Session = Depends(get_db)):
    """Issue a trial token for a guest user."""
    import uuid
    guest_id = f"guest-{uuid.uuid4()}"
    
    access_token = create_access_token(data={
        "sub": guest_id,
        "email": "guest@trial.com",
        "role": "guest"
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": guest_id,
            "email": "guest@trial.com",
            "full_name": "Guest User",
            "role": "guest"
        }
    }

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
