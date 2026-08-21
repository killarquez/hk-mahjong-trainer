"""
Database connection and session initialization module.
Supports PostgreSQL (for Docker deployment) and automatic fallback to SQLite (for local testing).
"""

import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("database")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://mahjong_user:mahjong_pass@localhost:5432/mahjong_db")

def create_db_engine():
    """Tries PostgreSQL connection; falls back immediately to SQLite if unreachable."""
    if "sqlite" in DATABASE_URL:
        return create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    try:
        pg_engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
        # Test active connection
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL database.")
        return pg_engine
    except Exception as e:
        logger.warning(f"PostgreSQL connection refused ({e}). Falling back to SQLite local database.")
        sqlite_url = "sqlite:///./mahjong_local.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for obtaining database session in FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all database tables on startup."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
