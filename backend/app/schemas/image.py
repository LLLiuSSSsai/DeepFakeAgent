from datetime import datetime
from pydantic import BaseModel


class ImageResponse(BaseModel):
    id: str
    original_name: str
    size: int
    width: int | None = None
    height: int | None = None
    format: str
    status: str
    created_at: datetime

    preview_url: str = ""
    thumbnail_url: str = ""

    model_config = {"from_attributes": True}


class ImageListResponse(BaseModel):
    images: list[ImageResponse]
    total: int
    page: int
    page_size: int
