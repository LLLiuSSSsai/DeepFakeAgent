import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.detection_service import ws_callbacks

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, set[WebSocket]] = {}

    async def connect(self, detection_id: str, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(detection_id, set()).add(ws)
        ws_callbacks.setdefault(detection_id, set()).add(self._make_callback(ws))

    def disconnect(self, detection_id: str, ws: WebSocket):
        if detection_id in self.connections:
            self.connections[detection_id].discard(ws)
            if not self.connections[detection_id]:
                del self.connections[detection_id]
        if detection_id in ws_callbacks:
            ws_callbacks[detection_id] = {
                cb for cb in ws_callbacks[detection_id]
                if getattr(cb, "__ws__", None) != ws
            }

    def _make_callback(self, ws: WebSocket):
        async def cb(event: dict):
            try:
                await ws.send_json(event)
            except Exception:
                pass

        cb.__ws__ = ws
        return cb


manager = ConnectionManager()


@router.websocket("/detections/{detection_id}")
async def detection_websocket(ws: WebSocket, detection_id: str):
    await manager.connect(detection_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(detection_id, ws)
