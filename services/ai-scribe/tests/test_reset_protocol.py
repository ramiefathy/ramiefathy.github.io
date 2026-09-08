"""Synthetic WebSocket protocol checks; no provider calls or patient data."""
import asyncio
import importlib
import json
import os
import pathlib
from types import SimpleNamespace

import pytest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in os.sys.path:
    os.sys.path.insert(0, str(ROOT))
os.environ.setdefault("SESSION_SECRET", "test-secret")
os.environ.setdefault("JWT_SIGNING_SECRET", "test-jwt-secret")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:8765")
app = importlib.import_module("app")


@pytest.mark.asyncio
@pytest.mark.parametrize("reset_id,valid", [
    (None, True), ("synthetic-reset", True), ("x" * 80, True),
    ("", False), ("x" * 81, False), (1, False), ({}, False), (["reset"], False),
])
async def test_reset_acknowledgment_contract(reset_id, valid):
    messages = []

    class Socket:
        remote_address = ("127.0.0.1", 0)
        request = SimpleNamespace(path="/", headers={
            "Authorization": "Bearer " + app.issue_jwt("reset-contract-" + repr(reset_id))
        })

        async def send(self, text):
            messages.append(json.loads(text))

        async def close(self, **kwargs):
            raise AssertionError("Unexpected authentication rejection")

        async def __aiter__(self):
            data = {} if reset_id is None else {"resetId": reset_id}
            yield json.dumps({"type": "start_new_session", "data": data})

    await asyncio.wait_for(app.handler(Socket()), timeout=5)
    replies = [message for message in messages if message["type"] != "connection_ack"]
    assert len(replies) == 1
    if valid:
        assert replies[0]["type"] == "status"
        assert replies[0]["event"] == "session_reset"
        assert replies[0]["resetId"] == reset_id
    else:
        assert replies[0]["type"] == "error"
        assert "reset identifier" in replies[0]["message"]
        assert "event" not in replies[0]
