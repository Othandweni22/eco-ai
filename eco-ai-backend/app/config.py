from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:darrel1622@localhost:5432/ecoaidb"

    # App
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Storage
    upload_dir: Path = Path("./uploads")
    max_upload_size: int = 10_485_760  # 10MB

    # Images
    allowed_image_types: list[str] = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
    ]

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # OSM
    osm_overpass_url: str = "https://overpass-api.de/api/interpreter"
    osm_cache_ttl: int = 2_592_000  # 30 days

    # Mock AI
    mock_ai_delay: float = 2.0

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="forbid",  # keep this strict
    )

settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
