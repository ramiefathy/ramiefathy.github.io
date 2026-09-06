"""Offline adversarial tests. No external AI requests or patient data are used."""
import asyncio
import importlib
import json
import os
import pathlib
from types import SimpleNamespace as NS

import jwt
import pytest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in os.sys.path:
    os.sys.path.insert(0, str(ROOT))
os.environ.setdefault("SESSION_SECRET", "test-secret")
os.environ.setdefault("JWT_SIGNING_SECRET", "test-jwt-secret")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:8765")
service_module = importlib.import_module("gemini_service")
app = importlib.import_module("app")
GenerationError = service_module.GenerationError


def response(text="result", reason="STOP"):
    return NS(candidates=[NS(finish_reason=reason, content=NS(parts=[NS(text=text)]))])


@pytest.fixture
def service(monkeypatch):
    monkeypatch.setattr(service_module.config, "GEMINI_DEFAULT_MODEL", "synthetic-test-model")
    return service_module.GeminiService("fake-test-key")


def fake_model(monkeypatch, generate):
    closed = []
    class Client:
        def __init__(self, **kwargs):
            self.aio = self
            self.models = NS(generate_content=generate, generate_content_stream=generate)
        def __enter__(self): return self
        def __exit__(self, *args): closed.append("sync")
        async def __aenter__(self): return self
        async def __aexit__(self, *args): closed.append("async")
    monkeypatch.setattr(service_module.genai, "Client", Client)
    return closed


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [response("partial", "MAX_TOKENS"), response("", "STOP"), NS(candidates=[])])
async def test_nonstream_rejects_partial_empty_or_blocked(monkeypatch, service, payload):
    async def generate(*args, **kwargs):
        return payload
    fake_model(monkeypatch, generate)
    with pytest.raises(GenerationError):
        await service.call_gemini_api("synthetic encounter")


@pytest.mark.asyncio
async def test_nonstream_returns_normal_complete_text(monkeypatch, service):
    async def generate(*args, **kwargs):
        return response("complete")
    fake_model(monkeypatch, generate)
    assert await service.call_gemini_api("synthetic encounter") == "complete"


@pytest.mark.parametrize("text", ["unsplit", "AI_ANALYSIS_SEPARATOR_V2", "note AI_ANALYSIS_SEPARATOR_V2 ",
    " AI_ANALYSIS_SEPARATOR_V2 analysis", "note AI_ANALYSIS_SEPARATOR_V2 analysis AI_ANALYSIS_SEPARATOR_V2 extra"])
def test_note_and_analysis_must_both_be_present(service, text):
    with pytest.raises(GenerationError):
        service.parse_initial_generation(text)


def test_valid_note_is_split_without_losing_content(service):
    assert service.parse_initial_generation(" note AI_ANALYSIS_SEPARATOR_V2 analysis ") == ("note", "analysis")


@pytest.mark.asyncio
@pytest.mark.parametrize("terminal", ["exception", "truncated", "missing_stop", "empty"])
async def test_failed_stream_never_completes_or_leaks_provider_body(monkeypatch, service, caplog, terminal):
    sensitive_marker = "SYNTHETIC_PRIVATE_MARKER"
    async def chunks():
        if terminal != "empty":
            yield response("provisional", None)
        if terminal == "exception":
            raise RuntimeError(sensitive_marker)
        if terminal == "truncated":
            yield response(sensitive_marker, "MAX_TOKENS")
        if terminal == "empty":
            yield response("", "STOP")
    async def generate(*args, **kwargs):
        return chunks()
    fake_model(monkeypatch, generate)
    seen = []
    with pytest.raises(GenerationError) as exc:
        async for value in service.stream_gemini_api("synthetic encounter"):
            seen.append(value)
    assert all(not done for text, done in seen)
    assert sensitive_marker not in str(exc.value)
    assert sensitive_marker not in caplog.text
    assert sensitive_marker not in str(seen)


@pytest.mark.asyncio
async def test_successful_stream_has_one_terminal_signal(monkeypatch, service):
    async def chunks():
        yield response("first ", None)
        yield response("second", "STOP")
    async def generate(*args, **kwargs):
        return chunks()
    fake_model(monkeypatch, generate)
    assert [item async for item in service.stream_gemini_api("synthetic")] == [
        ("first ", False), ("second", False), ("", True)
    ]


@pytest.mark.parametrize("missing", ["exp", "iat", "sub"])
def test_jwt_requires_lifetime_and_identity(missing):
    payload = app.verify_jwt(app.issue_jwt("tester"))
    payload.pop(missing)
    token = jwt.encode(payload, app.config.JWT_SIGNING_SECRET, algorithm="HS256")
    with pytest.raises(ValueError):
        app.verify_jwt(token)


@pytest.mark.asyncio
@pytest.mark.parametrize("finish", ["result", "error", "removed"])
async def test_old_encounter_suggestions_cannot_cross_reset(monkeypatch, finish):
    started, release = asyncio.Event(), asyncio.Event()
    async def call(*args, **kwargs):
        started.set()
        await release.wait()
        if finish == "error":
            raise RuntimeError("SYNTHETIC_PRIVATE_MARKER")
        return "Suggestion: old-encounter detail"
    monkeypatch.setattr(app, "gemini_service", NS(call_gemini_api=call))
    messages = []
    async def send(message):
        messages.append(json.loads(message))
    session_id = app.session_manager.create_session()
    session = app.session_manager.get_session(session_id)
    session.full_transcript = "synthetic previous encounter"
    task = asyncio.create_task(app.trigger_realtime_suggestions(NS(send=send), session_id))
    await started.wait()
    if finish == "removed":
        app.session_manager.remove_session(session_id)
    else:
        session.reset_session_data()
    messages.clear()
    release.set()
    await task
    assert not messages
    assert not session.shown_suggestion_texts
    app.session_manager.remove_session(session_id)


def test_duration_uses_monotonic_clock_even_at_zero(monkeypatch):
    module = importlib.import_module("session_manager")
    clock = iter([0.0, 61.0])
    monkeypatch.setattr(module.time, "monotonic", lambda: next(clock))
    session = module.Session("synthetic")
    session.start_timer()
    session.stop_timer()
    assert session.get_formatted_duration() == "00:01:01"


@pytest.mark.parametrize("model", [None, "", " ", "models/gemini-2.0-flash-exp", "gemini-2.0-flash", {"bad": "shape"}])
def test_missing_invalid_or_retired_model_is_rejected(monkeypatch, service, model):
    monkeypatch.setattr(service_module.config, "GEMINI_DEFAULT_MODEL", "")
    with pytest.raises(GenerationError):
        service._model_name(model)


def test_model_override_and_explicit_default(monkeypatch, service):
    assert service._model_name(None) == "synthetic-test-model"
    assert service._model_name(" models/selected-model ") == "selected-model"


def test_real_sdk_finish_reason_and_thought_parts():
    payload = service_module.types.GenerateContentResponse.model_validate({
        "candidates": [{"finishReason": "STOP", "content": {"parts": [
            {"text": "not clinical output", "thought": True}, {"text": "completed note"}
        ]}}]
    })
    assert service_module._candidate_text(payload) == ("completed note", True)


def test_multimodal_content_is_validated_and_decoded(service):
    parts = service._content("synthetic image", "aW1hZ2U=", "image/png")
    assert parts[1].inline_data.data == b"image"
    assert parts[1].inline_data.mime_type == "image/png"


@pytest.mark.parametrize("image,mime", [(None, "image/png"), ("aW1hZ2U=", None),
    ("broken!", "image/png"), ("", "image/png"), ("aW1hZ2U=", "text/html")])
def test_invalid_image_input_is_not_silently_dropped(service, image, mime):
    with pytest.raises(GenerationError):
        service._content("synthetic", image, mime)


@pytest.mark.asyncio
async def test_modern_sdk_request_and_transport_cleanup(monkeypatch, service):
    seen = []
    async def generate(**kwargs):
        seen.append(kwargs)
        return response("complete")
    closed = fake_model(monkeypatch, generate)
    assert await service.call_gemini_api("synthetic", model_name="models/selected-model") == "complete"
    assert seen == [{"model": "selected-model", "contents": "synthetic"}]
    assert closed == ["async", "sync"]


@pytest.mark.asyncio
async def test_cancelled_stream_closes_both_transports(monkeypatch, service):
    async def chunks():
        yield response("provisional", None)
        raise asyncio.CancelledError()
    async def generate(**kwargs): return chunks()
    closed = fake_model(monkeypatch, generate)
    seen = []
    with pytest.raises(asyncio.CancelledError):
        async for text, done in service.stream_gemini_api("synthetic"):
            seen.append((text, done))
    assert seen == [("provisional", False)]
    assert closed == ["async", "sync"]


@pytest.mark.asyncio
@pytest.mark.parametrize("streaming", [False, True])
async def test_safe_validation_error_survives_provider_boundary(monkeypatch, service, streaming):
    monkeypatch.setattr(service_module.config, "GEMINI_DEFAULT_MODEL", "")
    with pytest.raises(GenerationError, match="deployment-validated Gemini model"):
        if streaming:
            async for _ in service.stream_gemini_api("synthetic"):
                pass
        else:
            await service.call_gemini_api("synthetic")


@pytest.mark.asyncio
@pytest.mark.parametrize("operation", ["reset", "replacement", "disconnect"])
async def test_handler_invalidates_before_cancellation_can_return_a_result(monkeypatch, operation):
    """Exercise the real handler against a provider that suppresses cancellation."""
    started = asyncio.Event()
    messages = []
    cancellations = []

    async def call(*args, **kwargs):
        started.set()
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            cancellations.append(True)
            return "Suggestion: SYNTHETIC_STALE_ENCOUNTER"

    monkeypatch.setattr(app, "gemini_service", NS(call_gemini_api=call))

    class Socket:
        remote_address = ("127.0.0.1", 0)
        request = NS(path="/", headers={"Authorization": "Bearer " + app.issue_jwt("cancellation-" + operation)})

        async def send(self, text):
            messages.append(json.loads(text))

        async def close(self, **kwargs):
            raise AssertionError("Unexpected authentication rejection")

        async def __aiter__(self):
            yield json.dumps({"type": "transcript_segment", "data": {"segment": "synthetic " * 21, "is_final": True}})
            await asyncio.wait_for(started.wait(), timeout=2)
            if operation == "reset":
                yield json.dumps({"type": "start_new_session", "data": {"resetId": "synthetic-reset-1"}})
            elif operation == "replacement":
                yield json.dumps({"type": "transcript_segment", "data": {"segment": "replacement " * 21, "is_final": True}})
            # Ending iteration exercises the disconnect cleanup ordering as well.

    await asyncio.wait_for(app.handler(Socket()), timeout=5)
    if operation == "reset":
        assert any(message.get("event") == "session_reset" and message.get("resetId") == "synthetic-reset-1"
                   for message in messages)
    assert cancellations, "The stale provider must actually reach its cancellation handler"
    assert "SYNTHETIC_STALE_ENCOUNTER" not in json.dumps(messages)
    session_id = next(message["sessionId"] for message in messages if message["type"] == "connection_ack")
    assert app.session_manager.get_session(session_id) is None
