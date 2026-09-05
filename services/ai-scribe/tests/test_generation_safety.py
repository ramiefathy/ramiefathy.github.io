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


def response(text="result", reason=1):
    return NS(candidates=[NS(finish_reason=reason, content=NS(parts=[NS(text=text)]))])


@pytest.fixture
def service(monkeypatch):
    monkeypatch.setattr(service_module.genai, "configure", lambda **kwargs: None)
    return service_module.GeminiService("fake-test-key")


def fake_model(monkeypatch, generate):
    monkeypatch.setattr(service_module.genai, "GenerativeModel", lambda name: NS(generate_content_async=generate))


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [response("partial", 2), response("", 1), NS(candidates=[])])
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
            yield response("provisional", 0)
        if terminal == "exception":
            raise RuntimeError(sensitive_marker)
        if terminal == "truncated":
            yield response(sensitive_marker, 2)
        if terminal == "empty":
            yield response("", 1)
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
        yield response("first ", 0)
        yield response("second", 1)
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
