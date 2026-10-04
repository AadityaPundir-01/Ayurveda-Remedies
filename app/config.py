from typing import List, Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # LLM Settings
    LLM_PROVIDER: Literal["groq", "gemini"] = "groq"
    
    # Groq Settings
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Google Gemini Settings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Embedding Model (Hugging Face local free model)
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Qdrant Vector Store (Supports Hosted / Cloud Qdrant or Local Docker)
    QDRANT_URL: str = ""
    QDRANT_ENDPOINT: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_KEY: str = ""
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION_NAME: str = "medical_home_remedies"

    def get_qdrant_api_key(self) -> str | None:
        """Returns the trimmed API key if provided, else None."""
        raw_key = (self.QDRANT_API_KEY or self.QDRANT_KEY or "").strip()
        return raw_key if raw_key else None

    def get_qdrant_url(self) -> str | None:
        """Resolves the hosted / cloud Qdrant endpoint URL.
        
        Checks QDRANT_URL, QDRANT_ENDPOINT, and QDRANT_HOST.
        """
        # 1. Direct QDRANT_URL or QDRANT_ENDPOINT
        direct_url = (self.QDRANT_URL or self.QDRANT_ENDPOINT or "").strip()
        if direct_url:
            if not direct_url.startswith("http://") and not direct_url.startswith("https://"):
                direct_url = f"https://{direct_url}"
            return direct_url

        # 2. Check if QDRANT_HOST is set to a cloud host or URL
        host = (self.QDRANT_HOST or "").strip()
        if host and host.lower() not in ("localhost", "127.0.0.1", "0.0.0.0", ""):
            if host.startswith("http://") or host.startswith("https://"):
                return host
            if "cloud.qdrant.io" in host or self.get_qdrant_api_key():
                if ":" in host:
                    return f"https://{host}"
                port = self.QDRANT_PORT or 6333
                return f"https://{host}:{port}"

        return None

    def is_cloud_qdrant(self) -> bool:
        """Returns True if configured to use hosted / cloud Qdrant."""
        return self.get_qdrant_url() is not None or self.get_qdrant_api_key() is not None

    # Server Configuration
    APP_PORT: int = 8000
    APP_HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = ["*"]

    # Admin Authentication (protects the document upload endpoint)
    # Default predefined password is "Aaditya@123" which always works across local and cloud databases
    ADMIN_PASSWORD: str = "Aaditya@123"
    PREDEFINED_ADMIN_PASSWORD: str = "Aaditya@123"

    def get_valid_admin_passwords(self) -> set[str]:
        """Returns set of all valid admin passwords (configured + default predefined)."""
        valid = {self.PREDEFINED_ADMIN_PASSWORD}
        if self.ADMIN_PASSWORD and self.ADMIN_PASSWORD.strip():
            valid.add(self.ADMIN_PASSWORD.strip())
        return valid


settings = Settings()
