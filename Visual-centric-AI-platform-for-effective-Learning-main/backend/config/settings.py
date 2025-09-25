"""
Configuration settings for the RAG Educational AI Backend

This module manages all configuration settings and environment variables
for the application.
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseSettings, Field
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    """Application settings configuration."""
    
    # Database Configuration
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")
    
    # AI Model Configuration
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
    gemini_model_name: str = Field("gemini-2.0-flash", env="GEMINI_MODEL_NAME")
    embedding_model_name: str = Field("models/embedding-001", env="EMBEDDING_MODEL_NAME")
    
    # API Keys
    youtube_api_key: Optional[str] = Field(None, env="YOUTUBE_API_KEY")
    
    # Application Configuration
    debug: bool = Field(False, env="DEBUG")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    host: str = Field("localhost", env="HOST")
    port: int = Field(8000, env="PORT")
    
    # Vector Store Configuration
    vector_store_table_name: str = Field("documents", env="VECTOR_STORE_TABLE_NAME")
    vector_search_function_name: str = Field("custom_vector_search", env="VECTOR_SEARCH_FUNCTION_NAME")
    
    # Document Processing Configuration
    chunk_size: int = Field(1000, env="CHUNK_SIZE")
    chunk_overlap: int = Field(200, env="CHUNK_OVERLAP")
    max_file_size_mb: int = Field(10, env="MAX_FILE_SIZE_MB")
    supported_file_types: List[str] = Field(["pdf", "docx"], env="SUPPORTED_FILE_TYPES")
    
    # Rate Limiting Configuration
    max_requests_per_minute: int = Field(60, env="MAX_REQUESTS_PER_MINUTE")
    
    # CORS Configuration
    allowed_origins: List[str] = Field(
        [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ],
        env="ALLOWED_ORIGINS"
    )
    
    class Config:
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the application settings."""
    return settings


def validate_required_settings() -> List[str]:
    """Validate that all required settings are present."""
    missing_settings = []
    
    required_fields = [
        "supabase_url",
        "supabase_key", 
        "supabase_service_role_key",
        "gemini_api_key"
    ]
    
    for field in required_fields:
        if not getattr(settings, field):
            missing_settings.append(field.upper())
    
    return missing_settings
