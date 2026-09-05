import asyncio
import base64
import importlib
import json
import os
import pathlib

import jwt
import pytest
import pytest_asyncio
import websockets
from websockets.exceptions import ConnectionClosedError, InvalidStatusCode


# Ensure the service directory is on the import path
SERVICE_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in os.sys.path:
    os.sys.path.append(str(SERVICE_ROOT))


# Provide defaults for tests
os.environ.setdefault("SESSION_SECRET", "test-secret")
os.environ.setdefault("JWT_SIGNING_SECRET", "test-jwt-secret")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:8765")


# Import app after env vars are set so config picks them up
app = importlib.import_module("app")


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def ws_server():
    server = await websockets.serve(
        app.handler,
        "127.0.0.1",
        0,
        process_request=app.process_http_request,
    )
    port = server.sockets[0].getsockname()[1]
    try:
        yield f"ws://127.0.0.1:{port}"
    finally:
        server.close()
        await server.wait_closed()


@pytest.mark.asyncio
async def test_valid_jwt_connects(ws_server):
    token = app.issue_jwt("tester")
    async with websockets.connect(
        ws_server,
        additional_headers={"Authorization": f"Bearer {token}", "Origin": "http://localhost:8765"},
    ) as ws:
        ack = json.loads(await ws.recv())
        assert ack["type"] == "connection_ack"
        assert "token" not in ack


@pytest.mark.asyncio
async def test_legacy_token_receives_jwt(ws_server):
    legacy_secret = os.environ["SESSION_SECRET"]
    async with websockets.connect(
        f"{ws_server}?token={legacy_secret}",
        additional_headers={"Origin": "http://localhost:8765"},
    ) as ws:
        ack = json.loads(await ws.recv())
        assert ack["type"] == "connection_ack"
        assert "token" in ack
        # issued token should be a valid JWT signed with JWT_SIGNING_SECRET
        jwt.decode(ack["token"], os.environ["JWT_SIGNING_SECRET"], algorithms=["HS256"])


@pytest.mark.asyncio
async def test_subprotocol_secret_receives_jwt(ws_server):
    legacy_secret = os.environ["SESSION_SECRET"]
    encoded = base64url_encode(legacy_secret)

    async with websockets.connect(
        ws_server,
        subprotocols=[f"ramie-auth.{encoded}"],
        additional_headers={"Origin": "http://localhost:8765"},
    ) as ws:
        ack = json.loads(await ws.recv())
        assert ack["type"] == "connection_ack"
        assert "token" in ack
        jwt.decode(ack["token"], os.environ["JWT_SIGNING_SECRET"], algorithms=["HS256"])


@pytest.mark.asyncio
async def test_invalid_jwt_rejected(ws_server):
    with pytest.raises((ConnectionClosedError, InvalidStatusCode)) as exc:
        async with websockets.connect(
            ws_server,
            additional_headers={"Authorization": "Bearer bad-token", "Origin": "http://localhost:8765"},
        ) as ws:
            # If the server accepts then closes, read to surface the close code
            await ws.recv()

    # If we got a close frame, ensure it is the auth failure code
    if isinstance(exc.value, ConnectionClosedError):
        assert exc.value.code == 4008


@pytest.mark.asyncio
async def test_rate_limit_emits_retry_after(ws_server):
    token = app.issue_jwt("rate-tester")
    async with websockets.connect(
        ws_server,
        additional_headers={"Authorization": f"Bearer {token}", "Origin": "http://localhost:8765"},
    ) as ws:
        # consume ack
        await ws.recv()

        error_seen = False
        for _ in range(65):
            await ws.send(json.dumps({"type": "start_new_session"}))
            resp = json.loads(await ws.recv())
            if resp.get("type") == "error" and "retryAfter" in resp:
                error_seen = True
                assert resp["retryAfter"] >= 1
                break

        assert error_seen, "Expected rate limit error with retryAfter"


def base64url_encode(text: str) -> str:
    raw = text.encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode("utf-8")
    return encoded.rstrip("=")


@pytest.mark.asyncio
async def test_malformed_messages_do_not_kill_connection(ws_server):
    token = app.issue_jwt('malformed-message-test')
    async with websockets.connect(ws_server, additional_headers={'Authorization': f'Bearer {token}', 'Origin': 'http://localhost:8765'}) as ws:
        await ws.recv()
        for payload in [[], None, {'type': 'transcript_segment', 'data': 'not-an-object'}, {'type': 'transcript_segment', 'data': {'segment': ['bad'], 'is_final': True}}]:
            await ws.send(json.dumps(payload))
            assert json.loads(await ws.recv())['type'] == 'error'
        await ws.send(json.dumps({'type': 'start_new_session'}))
        assert json.loads(await ws.recv())['type'] == 'status'


@pytest.mark.asyncio
async def test_failed_note_stream_keeps_previous_completed_note(ws_server, monkeypatch):
    from types import SimpleNamespace
    async def fail_stream(*args, **kwargs):
        yield 'synthetic provisional text', False
        raise RuntimeError('SYNTHETIC_PROVIDER_PRIVATE_DETAIL')
    monkeypatch.setattr(app, 'gemini_service', SimpleNamespace(stream_gemini_api=fail_stream))
    token = app.issue_jwt('stream-failure-test')
    async with websockets.connect(ws_server, additional_headers={'Authorization': f'Bearer {token}', 'Origin': 'http://localhost:8765'}) as ws:
        ack = json.loads(await ws.recv())
        session = app.session_manager.get_session(ack['sessionId'])
        session.update_draft_note('Previously completed note')
        await ws.send(json.dumps({'type': 'stream_generate', 'data': {'streamType': 'note', 'transcript': 'synthetic encounter'}}))
        chunk = json.loads(await ws.recv())
        assert chunk['type'] == 'stream_chunk'
        error = json.loads(await ws.recv())
        assert error['type'] == 'error'
        assert error['area'] == 'stream'
        assert 'SYNTHETIC_PROVIDER_PRIVATE_DETAIL' not in json.dumps(error)
        assert session.current_draft_note == 'Previously completed note'
