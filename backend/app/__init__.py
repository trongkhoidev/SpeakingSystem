"""Main app initialization."""

from .core import settings
from .routes import main_router

__all__ = ["settings", "main_router"]
