"""Provider boundary: incomplete/blocked output is never a successful clinical result."""
import logging
import google.generativeai as genai
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
    # Google FinishReason: 0=unspecified (intermediate chunks), 1=STOP.
    if reason != 1 and not (streaming and reason in (None, 0)):
        raise GenerationError("Generation was interrupted or blocked; no result was saved.")
    parts = getattr(getattr(candidate, "content", None), "parts", None) or []
    text = "".join(part.text for part in parts if isinstance(getattr(part, "text", None), str))
    return text, reason == 1


class GeminiService:
    def __init__(self, api_key):
        if not api_key:
            raise ValueError("Gemini API Key is required for GeminiService.")
        genai.configure(api_key=api_key)

    @staticmethod
    def _content(prompt_text, image_base64, image_mime_type):
        if image_base64 and image_mime_type:
            return [prompt_text, {"mime_type": image_mime_type, "data": image_base64}]
        return prompt_text

    async def call_gemini_api(self, prompt_text, model_name=None, image_base64=None, image_mime_type=None):
        try:
            model = genai.GenerativeModel(model_name or config.GEMINI_DEFAULT_MODEL)
            response = await model.generate_content_async(self._content(prompt_text, image_base64, image_mime_type))
            text, _ = _candidate_text(response)
            if not text.strip():
                raise GenerationError("Generation returned no usable text.")
            return text
        except Exception as exc:
            # Provider exceptions may echo protected data. Do not log their messages or tracebacks.
            logger.warning("Generation failed (%s)", type(exc).__name__)
            raise GenerationError("Generation failed; no result was saved. Please retry.") from None

    async def stream_gemini_api(self, prompt_text, model_name=None, image_base64=None, image_mime_type=None):
        """Yield provisional text; mark complete only after a nonempty, normal STOP."""
        try:
            model = genai.GenerativeModel(model_name or config.GEMINI_DEFAULT_MODEL)
            response = await model.generate_content_async(
                self._content(prompt_text, image_base64, image_mime_type), stream=True
            )
            has_text = False
            stopped = False
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
            # An error is NOT an is_done=True text chunk: that would save it as a note.
            raise GenerationError("Generation failed; provisional output was not saved. Please retry.") from None

    def parse_initial_generation(self, response_text):
        separator = "AI_ANALYSIS_SEPARATOR_V2"
        if not isinstance(response_text, str) or response_text.count(separator) != 1:
            raise GenerationError("The generated note format was invalid; no result was saved.")
        note, analysis = (part.strip() for part in response_text.split(separator))
        if not note or not analysis:
            raise GenerationError("The generated note or analysis was missing; no result was saved.")
        return note, analysis
