import json
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.detection_service import DetectionService
from app.schemas.detection import DetectionCreate
from app.utils.response import APIResponse

router = APIRouter()


@router.post("")
async def create_detection(body: DetectionCreate, db: AsyncSession = Depends(get_db)):
    service = DetectionService(db)
    try:
        result = await service.create_detection(body.image_id, body.mode, body.purpose)
        return APIResponse.ok(result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{detection_id}")
async def get_detection(detection_id: str, db: AsyncSession = Depends(get_db)):
    service = DetectionService(db)
    status = await service.get_status(detection_id)
    if not status:
        raise HTTPException(status_code=404, detail="Detection not found")
    return APIResponse.ok(status.model_dump())


@router.get("")
async def list_detections(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = DetectionService(db)
    tasks, total = await service.list_detections(page, page_size)
    items = [
        {
            "detection_id": t.id,
            "image_id": t.image_id,
            "mode": t.mode,
            "status": t.status,
            "overall_progress": t.overall_progress,
            "risk_score": t.risk_score,
            "conclusion": t.conclusion,
            "total_duration": t.total_duration,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        }
        for t in tasks
    ]
    return APIResponse.ok({"detections": items, "total": total, "page": page, "page_size": page_size})


@router.post("/{detection_id}/cancel")
async def cancel_detection(detection_id: str, db: AsyncSession = Depends(get_db)):
    service = DetectionService(db)
    ok = await service.cancel_detection(detection_id)
    if not ok:
        raise HTTPException(status_code=409, detail="Cannot cancel detection in current state")
    return APIResponse.ok({"detection_id": detection_id, "status": "cancelled"})


@router.get("/{detection_id}/export/json")
async def export_json(detection_id: str, db: AsyncSession = Depends(get_db)):
    service = DetectionService(db)
    status = await service.get_status(detection_id)
    if not status or not status.result:
        raise HTTPException(status_code=404, detail="Result not available")
    return APIResponse.ok(status.result.model_dump())


@router.get("/{detection_id}/export/pdf")
async def export_pdf(detection_id: str, db: AsyncSession = Depends(get_db)):
    service = DetectionService(db)
    status = await service.get_status(detection_id)
    if not status or not status.result:
        raise HTTPException(status_code=404, detail="Result not available")

    try:
        import markdown
        from weasyprint import HTML

        md_text = status.result.report_markdown or ""
        html_body = markdown.markdown(md_text, extensions=["tables", "fenced_code"])
        html_doc = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;line-height:1.6}}
h1{{border-bottom:2px solid #059669;padding-bottom:8px}}h2{{color:#059669}}
table{{border-collapse:collapse;width:100%}}td,th{{border:1px solid #ddd;padding:8px}}
th{{background:#f0fdf4}}</style></head><body>{html_body}</body></html>"""

        pdf_bytes = HTML(string=html_doc).write_pdf()
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=detection-{detection_id}.pdf"},
        )
    except ImportError:
        raise HTTPException(status_code=501, detail="PDF export requires weasyprint and markdown packages")
