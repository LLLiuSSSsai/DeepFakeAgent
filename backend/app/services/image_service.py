import uuid
from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from PIL import Image as PILImage
from app.config import settings
from app.models.image import Image


ALLOWED_FORMATS = {"JPEG", "PNG", "WebP", "TIFF", "BMP"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".bmp"}


class ImageService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload(self, file: UploadFile) -> Image:
        ext = Path(file.filename).suffix.lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported format: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

        contents = await file.read()
        if len(contents) > settings.MAX_UPLOAD_SIZE:
            raise ValueError(f"File size exceeds {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB limit")

        image_id = f"img_{uuid.uuid4().hex[:8]}"
        storage_dir = settings.STORAGE_ROOT / "images"
        storage_dir.mkdir(parents=True, exist_ok=True)

        img = PILImage.open(file.file)
        fmt = img.format or ext.lstrip(".").upper()

        storage_path = storage_dir / f"{image_id}{ext}"
        with open(storage_path, "wb") as f:
            f.write(contents)

        # Thumbnail
        thumb_dir = settings.STORAGE_ROOT / "thumbnails"
        thumb_dir.mkdir(parents=True, exist_ok=True)
        thumb_path = thumb_dir / f"{image_id}_thumb.jpg"
        img.thumbnail(settings.THUMBNAIL_SIZE)
        img.convert("RGB").save(thumb_path, "JPEG", quality=80)

        record = Image(
            id=image_id,
            original_name=file.filename,
            storage_path=str(storage_path),
            thumbnail_path=str(thumb_path),
            size=len(contents),
            width=img.width,
            height=img.height,
            format=fmt,
            status="uploaded",
        )
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def list_images(self, page: int = 1, page_size: int = 20, status: str | None = None) -> tuple[list[Image], int]:
        q = select(Image)
        count_q = select(func.count(Image.id))
        if status:
            q = q.where(Image.status == status)
            count_q = count_q.where(Image.status == status)
        q = q.order_by(Image.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        total = (await self.db.execute(count_q)).scalar()
        images = (await self.db.execute(q)).scalars().all()
        return list(images), total

    async def get_image(self, image_id: str) -> Image | None:
        return await self.db.get(Image, image_id)

    async def delete_image(self, image_id: str) -> bool:
        img = await self.db.get(Image, image_id)
        if not img:
            return False
        for p in (img.storage_path, img.thumbnail_path):
            if p and Path(p).exists():
                Path(p).unlink()
        await self.db.delete(img)
        await self.db.commit()
        return True
