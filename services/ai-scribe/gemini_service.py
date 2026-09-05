"""Provider boundary: incomplete/blocked output is never a successful clinical result."""
import base64
import binascii
import logging
import re
from google import genai
from google.genai import types
import config

logger = logging.getLogger(__name__)


class GenerationError(RuntimeError):
    """Safe public error; never includes prompts, model responses, or provider bodies."""


def _candidate_text(response, *, streaming=False):
    candidates = getattr(response, "candidates", None)
    if not candidates:
        raise GenerationError("No usable generation was returned.")
    candidate = candidates[0]
    reason = getattr(candidate, "finish_reason", None)
    # google-genai uses string-valued FinishReason enums, not the legacy numeric enums.
    reason = getattr(reason, "value", reason)
    if reason != "STOP" and not (streaming and reason in (None, "FINISH_REASON_UNSPECIFIED")):
        raise GenerationError("Generation was interrupted or blocked; no result was saved.")
    parts = getattr(getattr(candidate, "content", None), "parts", None) or []
    text = "".join(part.text for part in parts
                   if isinstance(getattr(part, "text", None), str) and not getattr(part, "thought", False))
    return text, reason == "STOP"


class GeminiService:
    def __init__(self, api_key):
        if not api_key:
            raise ValueError("Gemini API Key is required for GeminiService.")
        # No global SDK configuration: concurrent instances cannot overwrite one another's key.
        self._api_key = api_key

    @staticmethod
    def _model_name(model_name):
        name = model_name or config.GEMINI_DEFAULT_MODEL
        if not isinstance(name, str) or not re.fullmatch(r"(?:models/)?[A-Za-z0-9_.-]+", name.strip()):
            raise GenerationError("A deployment-validated Gemini model must be configured.")
        name = name.strip().removeprefix("models/")
        if name.startswith("gemini-2.0-"):
            raise GenerationError("The configured Gemini model family has been retired.")
        return name

    @staticmethod
    def _content(prompt_text, image_base64, image_mime_type):
        if not isinstance(prompt_text, str) or not prompt_text.strip():
            raise GenerationError("Generation requires a nonempty prompt.")
        if image_base64 is None and image_mime_type is None:
            return prompt_text
        if not isinstance(image_base64, str) or image_mime_type not in {
            "image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"
        }:
            raise GenerationError("Image content and a supported image MIME type are required together.")
        try:
            image = base64.b64decode(image_base64, validate=True)
        except (ValueError, binascii.Error):
            raise GenerationError("Image encoding was invalid.") from None
        if not image:
            raise GenerationError("Image content was empty.")
        return [prompt_text, types.Part.from_bytes(data=image, mime_type=image_mime_type)]

    async def call_gemini_api(self, prompt_text, model_name=None, image_base64=None, image_mime_type=None):
        try:
            model = self._model_name(model_name)
            contents = self._content(prompt_text, image_base64, image_mime_type)
            # Close both transports, including on cancellation or provider errors.
            with genai.Client(api_key=self._api_key) as owner:
                async with owner.aio as client:
                    response = await client.models.generate_content(model=model, contents=contents)
            text, _ = _candidate_text(response)
            if not text.strip():
                raise GenerationError("Generation returned no usable text.")
            return text
        except Exception as exc:
            logger.warning("Generation failed (%s)", type(exc).__name__)
            raise GenerationError("Generation failed; no result was saved. Please retry.") from None

    async def stream_gemini_api(self, prompt_text, model_name=None, image_base64=None, image_mime_type=None):
        """Yield provisional text; mark complete only after a nonempty, normal STOP."""
        try:
            model = self._model_name(model_name)
            contents = self._content(prompt_text, image_base64, image_mime_type)
            has_text = False
            stopped = False
            with genai.Client(api_key=self._api_key) as owner:
                async with owner.aio as client:
                    response = await client.models.generate_content_stream(model=model, contents=contents)
                    async for chunk in response:
                        text, is_stop = _candidate_text(chunk, streaming=True)
                        if stopped and (text or not is_stop):
                            raise GenerationError("Unexpected content after generation completed.")
                        stopped = stopped or is_stop
                        has_text = has_text or bool(text.strip())
                        if text:
                            yield text, False
            if not has_text or not stopped:
                raise GenerationError("Generation ended without a complete result.")
            yield "", True
        except Exception as exc:
            logger.warning("Streaming generation failed (%s)", type(exc).__name__)
            raise GenerationError("Generation failed; provisional output was not saved. Please retry.") from None

    def parse_initial_generation(self, response_text):
        separator = "AI_ANALYSIS_SEPARATOR_V2"
        if not isinstance(response_text, str) or response_text.count(separator) != 1:
            raise GenerationError("The generated note format was invalid; no result was saved.")
        note, analysis = (part.strip() for part in response_text.split(separator))
        if not note or not analysis:
            raise GenerationError("The generated note or analysis was missing; no result was saved.")
        return note, analysis
