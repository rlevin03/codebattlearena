from fastapi import WebSocket
from typing import Dict
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # battle_id -> { player_id -> WebSocket }
        self.connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, battle_id: str, player_id: str, ws: WebSocket):
        await ws.accept()
        if battle_id not in self.connections:
            self.connections[battle_id] = {}
        self.connections[battle_id][player_id] = ws
        logger.info("WS connected: battle=%s player=%s", battle_id, player_id)

    def disconnect(self, battle_id: str, player_id: str):
        if battle_id in self.connections:
            self.connections[battle_id].pop(player_id, None)
            if not self.connections[battle_id]:
                del self.connections[battle_id]
        logger.info("WS disconnected: battle=%s player=%s", battle_id, player_id)

    async def broadcast(self, battle_id: str, message: dict):
        """Send a message to every connected player in the battle room."""
        if battle_id not in self.connections:
            return
        dead: list[str] = []
        for pid, ws in list(self.connections[battle_id].items()):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                logger.warning(
                    "Failed to send to player %s in battle %s — marking dead",
                    pid, battle_id,
                )
                dead.append(pid)
        for pid in dead:
            self.connections[battle_id].pop(pid, None)

    async def send_to(self, battle_id: str, player_id: str, message: dict):
        """Send a message to a single player."""
        ws = self.connections.get(battle_id, {}).get(player_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                logger.warning(
                    "Failed to send_to player %s in battle %s",
                    player_id, battle_id,
                )
                self.connections[battle_id].pop(player_id, None)


# Singleton used throughout the app
manager = ConnectionManager()
