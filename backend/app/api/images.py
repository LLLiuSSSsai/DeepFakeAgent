from fastapi import APIRouter, UploadFile, File, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.image_service import ImageService
from app.schemas.image import ImageResponse, ImageListResponse
from app.utils.response import APIResponse

router = APIRouter()


@router.post("/upload")
async def upload_images(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    service = ImageService(db)
    uploaded = []
    failed = []

    for file in files:
        try:
            img = await service.upload(file)
            uploaded.append(ImageResponse(
                id=img.id,
                original_name=img.original_name,
                size=img.size,
                width=img.width,
                height=img.height,
                format=img.format,
                status=img.status,
                created_at=img.created_at,
                preview_url=f"/api/v1/images/{img.id}/file",
                thumbnail_url=f"/api/v1/images/{img.id}/thumbnail",
            ))
        except ValueError as e:
            failed.append({"original_name": file.filename, "reason": "validation_error", "message": str(e)})

    return APIResponse.ok({"images": uploaded, "failed": failed})


@router.get("")
async def list_images(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = ImageService(db)
    images, total = await service.list_images(page, page_size, status)
    items = [
        ImageResponse(
            id=img.id,
            original_name=img.original_name,
            size=img.size,
            width=img.width,
            height=img.height,
            format=img.format,
            status=img.status,
            created_at=img.created_at,
            preview_url=f"/api/v1/images/{img.id}/file",
            thumbnail_url=f"/api/v1/images/{img.id}/thumbnail",
        )
        for img in images
    ]
    return APIResponse.ok({"images": items, "total": total, "page": page, "page_size": page_size})


@router.get("/{image_id}")
async def get_image(image_id: str, db: AsyncSession = Depends(get_db)):
    service = ImageService(db)
    img = await service.get_image(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return APIResponse.ok(ImageResponse(
        id=img.id,
        original_name=img.original_name,
        size=img.size,
        width=img.width,
        height=img.height,
        format=img.format,
        status=img.status,
        created_at=img.created_at,
        preview_url=f"/api/v1/images/{img.id}/file",
        thumbnail_url=f"/api/v1/images/{img.id}/thumbnail",
    ))


@router.delete("/{image_id}")
async def delete_image(image_id: str, db: AsyncSession = Depends(get_db)):
    service = ImageService(db)
    deleted = await service.delete_image(image_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")
    return APIResponse.ok(message="Deleted")


@router.get("/{image_id}/file")
async def serve_image(image_id: str, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import FileResponse
    service = ImageService(db)
    img = await service.get_image(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(img.storage_path)


@router.get("/{image_id}/thumbnail")
async def serve_thumbnail(image_id: str, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import FileResponse
    service = ImageService(db)
    img = await service.get_image(image_id)
    if not img or not img.thumbnail_path:
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(img.thumbnail_path)
