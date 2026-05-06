from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    DATABASE_URL: str = "sqlite+aiosqlite:///./storage/deepfake.db"
    STORAGE_ROOT: Path = Path("./storage")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_IMAGE_COUNT: int = 100
    DETECTION_TIMEOUT: int = 120
    THUMBNAIL_SIZE: tuple[int, int] = (256, 256)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
        (self.STORAGE_ROOT / "images").mkdir(exist_ok=True)
        (self.STORAGE_ROOT / "thumbnails").mkdir(exist_ok=True)


settings = Settings()
