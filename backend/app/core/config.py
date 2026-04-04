"""Configuration management using environment variables."""

import os
from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = ConfigDict(
        env_file=".env",
        extra="allow"  # Allow extra env vars without validation errors
    )
    
    # FastAPI
    APP_NAME: str = "LexiLearn API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Deepgram
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    DEEPGRAM_MODEL: str = os.getenv("DEEPGRAM_MODEL", "nova-3")
    
    # Azure Speech
    AZURE_SPEECH_KEY: str = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION: str = os.getenv("AZURE_SPEECH_REGION", "eastasia")
    
    # LLM (Gemini or GPT)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # gemini or openai
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    
    # Azure SQL
    DB_SERVER: str = os.getenv("DB_SERVER", "speakingsystem.database.windows.net")
    DB_NAME: str = os.getenv("DB_NAME", "lexilearn")
    DB_USER: str = os.getenv("DB_USER", "trongkhoidev")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "@Speakingsystem")
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    
    @property
    def DATABASE_URL(self) -> str:
        # Format for pyodbc: mssql+pyodbc://user:password@server:port/database?driver=...
        return f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_SERVER}/{self.DB_NAME}?driver={self.DB_DRIVER.replace(' ', '+')}"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_CONF_URL: str = "https://accounts.google.com/.well-known/openid-configuration"

    # JWT Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey123")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Storage
    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    AUDIO_STORAGE_BUCKET: str = os.getenv("AUDIO_STORAGE_BUCKET", "audio-recordings")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
    ]


settings = Settings()
