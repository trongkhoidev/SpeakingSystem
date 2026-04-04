"""Main FastAPI application."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from app.core.config import settings
from app.routes import main_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app startup and shutdown."""
    
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    
    # Startup
    logger.info("Services initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down services...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# ============ MIDDLEWARE SETUP ============

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# Trusted host middleware (optional security)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*"],
)


# ============ ERROR HANDLERS ============

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ============ ROUTES ============

app.include_router(main_router)


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API documentation."""
    
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }


# ============ STARTUP EVENTS ============

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    
    logger.info("Validating external service connections...")
    
    # Check Deepgram connection
    if not settings.DEEPGRAM_API_KEY:
        logger.warning("⚠️  Deepgram API key not configured")
    else:
        logger.info("✓ Deepgram configured")
    
    # Check Azure connection
    if not settings.AZURE_SPEECH_KEY:
        logger.warning("⚠️  Azure Speech key not configured")
    else:
        logger.info("✓ Azure Speech configured")
    
    # Check LLM connection
    if settings.LLM_PROVIDER == "gemini":
        if not settings.GEMINI_API_KEY:
            logger.warning("⚠️  Gemini API key not configured")
        else:
            logger.info("✓ Gemini configured")
    else:
        if not settings.OPENAI_API_KEY:
            logger.warning("⚠️  OpenAI API key not configured")
        else:
            logger.info("✓ OpenAI configured")
    
    # Check Supabase connection
    if not settings.SUPABASE_URL:
        logger.warning("⚠️  Supabase URL not configured")
    else:
        logger.info("✓ Supabase configured")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
