"""Main FastAPI application."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import warnings
from app.core.config import settings
from app.routes import main_router

# Suppress minor runtime warnings that don't affect functionality
warnings.filterwarnings("ignore", category=RuntimeWarning, module="pydub.*")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app startup and shutdown."""
    
    # Log ngay lập tức để Railway biết app đang chạy
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    logger.info(f"🌐 Environment: {'Debug' if settings.DEBUG else 'Production'}")
    logger.info(f"🔒 CORS Allowed Origins: {settings.CORS_ORIGINS}")
    logger.info("✅ App ready — database will connect on first request")
    
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


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
