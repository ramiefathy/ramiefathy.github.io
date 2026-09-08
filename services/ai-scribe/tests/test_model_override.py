"""Client model overrides are allowlisted server-side; nothing here contacts a provider."""
import asyncio
import importlib
import json
import os
import pathlib
import subprocess
import sys
from types import SimpleNamespace as NS

import pytest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in os.sys.path:
    os.sys.path.insert(0, str(ROOT))
os.environ.setdefault("GEMINI_DEFAULT_MODEL", "synthetic-test-model")
os.environ.setdefault("SESSION_SECRET", "test-secret")
os.environ.setdefault("JWT_SIGNING_SECRET", "test-jwt-secret")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:8765")
config = importlib.import_module("config")
service_module = importlib.import_module("gemini_service")
app = importlib.import_module("app")


def _fresh_config(env_overrides):
    """Import config.py in a clean interpreter so startup validation is exercised for real."""
    env = {k: v for k, v in os.environ.items() if not k.startswith("GEMINI_")}
    env.update({"SESSION_SECRET": "x", "JWT_SIGNING_SECRET": "y"})
    env.update(env_overrides)
    return subprocess.run(
        [sys.executable, "-c", "import config, json; print(json.dumps(sorted(config.GEMINI_ALLOWED_MODELS)))"],
        cwd=ROOT, env=env, capture_output=True, text=True, timeout=30,
    )


def _allowlist_from(result):
    # config.py prints configuration warnings to stdout ahead of the JSON line.
    return json.loads(result.stdout.strip().splitlines()[-1])


def test_missing_default_model_is_a_startup_error():
    result = _fresh_config({"GEMINI_DEFAULT_MODEL": "   "})
    assert result.returncode != 0
    assert "RuntimeError" in result.stderr
    assert "GEMINI_DEFAULT_MODEL" in result.stderr


def test_allowlist_defaults_to_the_default_model_only():
    result = _fresh_config({"GEMINI_DEFAULT_MODEL": "models/synthetic-default"})
    assert result.returncode == 0, result.stderr
    assert _allowlist_from(result) == ["synthetic-default"]


def test_allowlist_parses_comma_separated_names_and_always_includes_the_default():
    result = _fresh_config({
        "GEMINI_DEFAULT_MODEL": "synthetic-default",
        "GEMINI_ALLOWED_MODELS": " synthetic-alt , models/synthetic-other ,, ",
    })
    assert result.returncode == 0, result.stderr
    assert _allowlist_from(result) == ["synthetic-alt", "synthetic-default", "synthetic-other"]


@pytest.fixture
def allowlist(monkeypatch):
    monkeypatch.setattr(config, "GEMINI_DEFAULT_MODEL", "synthetic-default")
    monkeypatch.setattr(config, "GEMINI_VISION_MODEL", "synthetic-vision")
    monkeypatch.setattr(config, "GEMINI_SUGGESTION_MODEL", "synthetic-suggest")
    monkeypatch.setattr(config, "GEMINI_ALLOWED_MODELS", frozenset({"synthetic-default", "synthetic-alt"}))


@pytest.mark.parametrize("requested,expected", [
    (None, "synthetic-default"),
    ("synthetic-alt", "synthetic-alt"),
    ("models/synthetic-alt", "synthetic-alt"),
    ("  synthetic-alt  ", "synthetic-alt"),
    ("synthetic-default", "synthetic-default"),
])
def test_allowlisted_overrides_are_honored(allowlist, requested, expected):
    assert service_module.resolve_model_override(requested) == expected


@pytest.mark.parametrize("requested", ["SYNTHETIC_PRIVATE_MODEL_NAME", "gemini-2.0-flash", "", "x" * 500, 12, ["synthetic-alt"], {"model": "synthetic-alt"}, True])
def test_unlisted_or_malformed_overrides_fall_back_and_never_log_the_raw_value(allowlist, caplog, requested):
    with caplog.at_level("WARNING"):
        assert service_module.resolve_model_override(requested) == "synthetic-default"
        assert service_module.resolve_model_override(requested, config.GEMINI_VISION_MODEL) == "synthetic-vision"
    assert caplog.records, "A rejected override must be logged by rejection class"
    assert "SYNTHETIC_PRIVATE_MODEL_NAME" not in caplog.text
    assert "gemini-2.0" not in caplog.text
    assert any(("not_allowlisted" in record.getMessage()) or ("non_string" in record.getMessage()) for record in caplog.records)


@pytest.mark.asyncio
@pytest.mark.parametrize("message_type", ["stream_generate", "stop_finalize_recording", "discussion_input", "analyze_image", "integrate_image_description"])
async def test_handler_never_forwards_an_unlisted_client_model(allowlist, monkeypatch, message_type):
    used = []

    async def call(prompt, model_name=None, **kwargs):
        used.append(model_name)
        return "note AI_ANALYSIS_SEPARATOR_V2 analysis"

    async def stream(prompt, model_name=None, **kwargs):
        used.append(model_name)
        yield "note AI_ANALYSIS_SEPARATOR_V2 analysis", False
        yield "", True

    real = service_module.GeminiService("fake-test-key")
    monkeypatch.setattr(app, "gemini_service", NS(call_gemini_api=call, stream_gemini_api=stream, parse_initial_generation=real.parse_initial_generation))
    messages = []

    class Socket:
        remote_address = ("127.0.0.1", 0)
        request = NS(path="/", headers={"Authorization": "Bearer " + app.issue_jwt("model-override-" + message_type)})

        async def send(self, text):
            messages.append(json.loads(text))

        async def close(self, **kwargs):
            raise AssertionError("Unexpected authentication rejection")

        async def __aiter__(self):
            data = {"modelName": "SYNTHETIC_PRIVATE_MODEL_NAME", "transcript": "synthetic encounter", "text": "synthetic question",
                    "intent": "general_question", "imageBase64": "AAAA", "imageMimeType": "image/png", "description": "synthetic image"}
            yield json.dumps({"type": message_type, "data": data})

    await asyncio.wait_for(app.handler(Socket()), timeout=5)
    assert used, "The mocked provider should have been called"
    expected = "synthetic-vision" if message_type == "analyze_image" else "synthetic-default"
    assert used == [expected] * len(used)
    assert "SYNTHETIC_PRIVATE_MODEL_NAME" not in json.dumps(messages)


@pytest.mark.asyncio
async def test_realtime_suggestions_ignore_unlisted_client_model(allowlist, monkeypatch):
    used = []

    async def call(prompt, model_name=None, **kwargs):
        used.append(model_name)
        return "No specific suggestions at this moment."

    monkeypatch.setattr(app, "gemini_service", NS(call_gemini_api=call))
    session_id = app.session_manager.create_session()
    app.session_manager.get_session(session_id).full_transcript = "synthetic transcript"
    sent = []

    async def send(text):
        sent.append(json.loads(text))

    await app.trigger_realtime_suggestions(NS(send=send), session_id, "SYNTHETIC_PRIVATE_MODEL_NAME")
    app.session_manager.remove_session(session_id)
    assert used == ["synthetic-suggest"]
