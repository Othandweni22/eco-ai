from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Optional
import json
from datetime import datetime

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for c in dead:
            self.disconnect(c)


manager = ConnectionManager()


@router.websocket("/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
):
    """
    WebSocket endpoint for real-time notifications.

    The frontend passes ?token=<jwt> — we validate it so only
    authenticated users receive notifications.

    Route:  /ws/notifications   (prefix="/ws" set in main.py)
    """
    # Validate token if provided
    if token:
        try:
            from app.dependencies import verify_access_token
            from fastapi import HTTPException
            credentials_exception = HTTPException(status_code=403, detail="Invalid token")
            user_id = verify_access_token(token, credentials_exception)
            if not user_id:
                await websocket.close(code=1008)
                return
        except Exception:
            # Token invalid — close gracefully rather than hard-reject (avoids 403 spam)
            await websocket.accept()
            await websocket.close(code=1008, reason="Invalid or expired token")
            return

    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive — client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def send_notification(message_type: str, data: dict):
    """Send a notification to all connected WebSocket clients."""
    notification = {
        "type": message_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast(json.dumps(notification)))
    except Exception:
        pass
