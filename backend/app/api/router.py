from fastapi import APIRouter
from app.api import images, detections, websocket

api_router = APIRouter()
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(detections.router, prefix="/detections", tags=["detections"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
