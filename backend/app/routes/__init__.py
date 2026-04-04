"""API routes initialization."""

from fastapi import APIRouter
from .speech_routes import router as speech_router
from .auth_routes import router as auth_router
from .user_routes import router as user_router
from .topic_routes import router as topic_router
from .question_routes import router as question_router
from .test_routes import router as test_router
from .audio_routes import router as audio_router

main_router = APIRouter(prefix="/api/v1")
main_router.include_router(speech_router)
main_router.include_router(auth_router)
main_router.include_router(user_router)
main_router.include_router(topic_router)
main_router.include_router(question_router)
main_router.include_router(test_router)
main_router.include_router(audio_router)

__all__ = ["main_router"]
