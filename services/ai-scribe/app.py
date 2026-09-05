# server/app.py
import asyncio
import websockets
import json
import os
import logging
import time
import base64
from collections import deque
from datetime import datetime, timedelta, timezone
import jwt

# Import local modules
import config 
from urllib.parse import urlparse, parse_qs
from session_manager import SessionManager
from gemini_service import GeminiService
from prompts import (
    INITIAL_GENERATION_PROMPT_TEMPLATE,
    NOTE_REFINEMENT_PROMPT_TEMPLATE,
    AI_ANALYSIS_REFINEMENT_PROMPT_TEMPLATE,
    IMAGE_ANALYSIS_PROMPT_TEMPLATE,
    CONVERSATIONAL_CASE_DISCUSSION_PROMPT_TEMPLATE,
    REALTIME_SUGGESTION_PROMPT_TEMPLATE
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)

def log_event(action: str, **fields):
    payload = {"action": action, **fields}
    try:
        logger.info(json.dumps(payload))
    except Exception:
        logger.info(f"{action} | {fields}")


# Simple sliding-window rate limiter with metrics
class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = window_seconds
        self.events = {}
        self.metrics = {}

    def allow(self, key: str):
        now = time.time()
        q = self.events.setdefault(key, deque())
        metric = self.metrics.setdefault(key, {"allowed": 0, "blocked": 0, "last_block": None})
        # Drop old events
        while q and q[0] <= now - self.window:
            q.popleft()
        if len(q) >= self.max_requests:
            metric["blocked"] += 1
            metric["last_block"] = now
            retry_after = max(1, int(self.window - (now - q[0])))
            if metric["blocked"] % RATE_LIMIT_ALERT_THRESHOLD == 0:
                log_event("rate_limit_alert", client=key, blocked=metric["blocked"], window=self.window)
            return False, retry_after
        q.append(now)
        metric["allowed"] += 1
        return True, None

    def snapshot(self):
        return self.metrics.copy()


# Initialize services
session_manager = SessionManager()
gemini_service = None
rate_limiter = RateLimiter(max_requests=60, window_seconds=60)  # 60 messages/minute per client
RATE_LIMIT_ALERT_THRESHOLD = int(os.getenv("RATE_LIMIT_ALERT_THRESHOLD", "20"))
JWT_TTL_MINUTES = 15
LEGACY_SUBJECT = "legacy-client"


def issue_jwt(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_TTL_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, config.JWT_SIGNING_SECRET, algorithm="HS256")


def verify_jwt(token: str):
    try:
        return jwt.decode(token, config.JWT_SIGNING_SECRET, algorithms=["HS256"], options={"require": ["exp", "iat", "sub"]})
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid authentication token") from None


def decode_ramie_auth_subprotocol(encoded_token: str) -> str | None:
    """
    Decode a base64url token supplied via the WebSocket subprotocol header.

    Browsers don't allow setting custom headers for WebSocket connections, so we
    support passing an auth token as a subprotocol entry:
      Sec-WebSocket-Protocol: ramie-auth.<base64url(token)>
    """

    try:
        padded = encoded_token + ("=" * (-len(encoded_token) % 4))
        raw = base64.urlsafe_b64decode(padded.encode("utf-8"))
        return raw.decode("utf-8")
    except Exception:
        return None


def build_client_key(claims_sub: str | None, session_id: str | None, remote_address):
    """
    Generate a rate-limit bucket key with better isolation for legacy clients.

    - Modern clients keep using their JWT subject for per-user limiting.
    - Legacy (shared-secret) clients get a unique key per connection using the server-issued
      session_id; if unavailable, fall back to the client IP to avoid global coupling.
    """

    if claims_sub and claims_sub != LEGACY_SUBJECT:
        return claims_sub

    if session_id:
        return f"{LEGACY_SUBJECT}:{session_id}"

    if remote_address:
        ip = remote_address[0] if isinstance(remote_address, tuple) else str(remote_address)
        return f"{LEGACY_SUBJECT}:{ip}"

    return LEGACY_SUBJECT


def get_gemini_service():
    """Lazily construct the GeminiService when an API key is present."""
    global gemini_service
    if gemini_service is not None:
        return gemini_service

    if not config.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured; AI responses are disabled.")
        return None

    gemini_service = GeminiService(api_key=config.GEMINI_API_KEY)
    return gemini_service


async def ensure_gemini_service(websocket):
    """Ensure the Gemini client is available, otherwise notify the caller."""
    service = get_gemini_service()
    if service is None:
        await websocket.send(json.dumps({
            "type": "error",
            "message": "Gemini API key is not configured on the server. AI features are unavailable."
        }))
    return service

# --- Custom HTTP Request Processing for Health Checks ---
async def process_http_request(connection, request):
    """
    Handles initial HTTP requests.
    Responds to Render's health checks (often GET or HEAD on /)
    to prevent WebSocket handshake errors from these pings.
    """
    path = urlparse(getattr(request, "path", "") or "").path
    headers = getattr(request, "headers", None)
    upgrade_header = headers.get("Upgrade") if headers else None
    logger.debug(f"process_http_request received: Path='{path}', Upgrade='{upgrade_header}'")

    # If it's a WebSocket upgrade request, let the library handle it
    if upgrade_header and upgrade_header.lower() == "websocket":
        logger.debug("Request is a WebSocket upgrade. Passing to WebSocket handler.")
        return None  # Let the WebSocket handshake proceed

    # Treat requests to the root path (or missing path) as health checks regardless of method.
    if path in (None, '', '/'):
        logger.info(f"Responding to HTTP health check (path: '{path}').")
        return connection.respond(200, "OK")
    
    logger.warning(f"Unhandled HTTP request for path: '{path}'. Returning 404.")
    return connection.respond(404, "Not Found")


# --- WebSocket Handler ---
async def handler(websocket):
    """
    Handles WebSocket connections and messages from clients.
    """
    session_id = None
    client_key = None
    suggestion_tasks = set()

    async def cancel_suggestions():
        tasks = tuple(suggestion_tasks)
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        suggestion_tasks.clear()

    try:
        request = getattr(websocket, "request", None)
        request_headers = getattr(request, "headers", None)
        request_path = getattr(request, "path", "") if request else ""

        origin = request_headers.get("Origin") if request_headers else None
        if origin and origin not in config.ALLOWED_ORIGINS:
            logger.warning(f"Rejected connection from disallowed origin: {origin}")
            await websocket.close(code=4003, reason="Origin not allowed")
            return

        subprotocol_token = None
        subprotocol_header = request_headers.get("Sec-WebSocket-Protocol") if request_headers else None
        if subprotocol_header:
            offered = [p.strip() for p in subprotocol_header.split(",") if p.strip()]
            for proto in offered:
                if proto.startswith("ramie-auth."):
                    encoded = proto[len("ramie-auth.") :]
                    subprotocol_token = decode_ramie_auth_subprotocol(encoded)
                    if not subprotocol_token:
                        logger.warning("Rejected invalid ramie-auth subprotocol token (decode failed).")
                    break

        bearer_header = request_headers.get("Authorization") if request_headers else None
        auth_header = request_headers.get("X-Auth-Token") if request_headers else None
        query_token = None

        effective_path = request_path or ""
        parsed = urlparse(effective_path)
        redacted_path = parsed.path
        if parsed.query:
            query_token = parse_qs(parsed.query).get("token", [None])[0]

        raw_token = auth_header or subprotocol_token or query_token
        presented_token = None

        if bearer_header and bearer_header.lower().startswith("bearer "):
            presented_token = bearer_header.split(" ", 1)[1].strip()
        elif raw_token:
            presented_token = raw_token.strip()

        claims = None
        issued_jwt = None

        # Accept either a signed JWT or the shared secret (for legacy clients); if shared secret, issue a short-lived JWT.
        if presented_token:
            if presented_token == config.SESSION_SECRET:
                claims = {"sub": LEGACY_SUBJECT}
                issued_jwt = issue_jwt(claims["sub"])
            else:
                try:
                    claims = verify_jwt(presented_token)
                except ValueError as exc:
                    logger.warning(f"Rejected connection due to invalid JWT: {exc}")
                    await websocket.close(code=4008, reason="Authentication required")
                    return
        else:
            logger.warning("Rejected connection due to missing token")
            await websocket.close(code=4008, reason="Authentication required")
            return

        session_id = session_manager.create_session()
        client_key = build_client_key(claims.get("sub") if claims else None, session_id, websocket.remote_address)
        log_event(
            "connection",
            session_id=session_id,
            client=client_key,
            path=redacted_path,
            token_in_query=bool(query_token),
            token_in_subprotocol=bool(subprotocol_token),
            address=str(websocket.remote_address),
        )
        ack_payload = {"type": "connection_ack", "sessionId": session_id, "message": "Connected to AI Scribe Server"}
        if issued_jwt:
            ack_payload["token"] = issued_jwt
        await websocket.send(json.dumps(ack_payload))

        async for message_str in websocket:
            message_start = time.perf_counter()
            message_type = "unknown"
            allowed, retry_after = rate_limiter.allow(client_key)
            if not allowed:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Rate limit exceeded. Please slow down and retry.",
                    "retryAfter": retry_after
                }))
                log_event("rate_limited", client=client_key, session_id=session_id, retry_after=retry_after)
                continue
            try:
                message = json.loads(message_str)
                if not isinstance(message, dict) or not isinstance(message.get("type"), str):
                    raise ValueError()
                data = message.get("data", {})
                if not isinstance(data, dict):
                    raise ValueError()
            except (ValueError, TypeError):
                await websocket.send(json.dumps({"type": "error", "message": "Invalid message format."}))
                continue
            message_type = message["type"]
            current_session_id_to_use = session_id 

            session = session_manager.get_session(current_session_id_to_use)
            if not session:
                logger.error(f"Session {current_session_id_to_use} not found for client {websocket.remote_address}")
                await websocket.send(json.dumps({"type": "error", "message": "Session not found. Please reconnect."}))
                break

            logger.debug("Received a client message")

            if message_type == "start_new_session":
                logger.info(f"Starting new session explicitly for {current_session_id_to_use}")
                # Invalidate before yielding: providers may return while handling cancellation.
                session.reset_session_data()
                await cancel_suggestions()
                await websocket.send(json.dumps({"type": "status", "message": "New session initialized. Ready to record."}))

            elif message_type == "transcript_segment":
                segment = data.get("segment", "")
                is_final = data.get("is_final", data.get("isFinal", False))

                if not isinstance(segment, str) or not isinstance(is_final, bool):
                    await websocket.send(json.dumps({"type": "error", "message": "Invalid transcript segment."}))
                    continue

                is_discussion = bool(data.get("is_discussion", data.get("isDiscussion", False)))
                if is_discussion:
                    # Do not pollute the encounter transcript with "discussion" microphone input.
                    if isinstance(segment, str) and segment.strip():
                        session.add_discussion_entry("physician", segment.strip())
                    continue

                session.add_transcript_segment(segment, is_final)
                current_word_count = len(session.full_transcript.split())
                suggestion_trigger_threshold = 20
                if is_final and current_word_count > session.last_suggestion_word_count + suggestion_trigger_threshold:
                    session.last_suggestion_word_count = current_word_count
                    session.generation += 1  # Invalidate superseded suggestion context before awaiting.
                    await cancel_suggestions()
                    task = asyncio.create_task(
                        trigger_realtime_suggestions(
                            websocket, current_session_id_to_use, data.get("modelName")
                        )
                    )
                    suggestion_tasks.add(task)
                    task.add_done_callback(suggestion_tasks.discard)

            elif message_type == "stop_finalize_recording":
                logger.info(f"Finalizing recording for session {current_session_id_to_use}")
                provided_transcript = data.get("transcript")
                if isinstance(provided_transcript, str) and provided_transcript.strip():
                    # Allow the client to provide an authoritative final transcript (e.g., chat-to-note flow),
                    # rather than relying exclusively on previously streamed transcript segments.
                    session.full_transcript = provided_transcript.strip()
                session.stop_timer() 
                await websocket.send(json.dumps({"type": "status", "message": "Finalizing note and analysis..."}))
                service = await ensure_gemini_service(websocket)
                if not service:
                    continue

                prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                try:
                    response_text = await service.call_gemini_api(prompt, model_name=data.get("modelName", config.GEMINI_DEFAULT_MODEL))
                    note_text, analysis_text = service.parse_initial_generation(response_text)
                    session.update_draft_note(note_text)
                    session.update_ai_analysis(analysis_text)
                    await websocket.send(json.dumps({
                        "type": "initial_generation_complete",
                        "draftNote": note_text,
                        "aiAnalysis": analysis_text
                    }))
                except Exception as e:
                    logger.error("Request failed (%s)", type(e).__name__)
                    await websocket.send(json.dumps({"type": "error", "message": "AI operation failed; no new result was saved. Please retry."}))

            elif message_type == "stream_generate":
                # Streaming generation - sends chunks as they arrive.
                # Supported stream types:
                # - note: generates initial note + analysis (server updates session on completion)
                # - chat: streams a conversational response (server updates discussion history)
                logger.info(f"Streaming generation for session {current_session_id_to_use}")
                stream_type = data.get("streamType", "note")
                model_name_pref = data.get("modelName", config.GEMINI_DEFAULT_MODEL)

                transcript_override = data.get("transcript")
                if isinstance(transcript_override, str) and transcript_override.strip():
                    session.full_transcript = transcript_override.strip()

                service = await ensure_gemini_service(websocket)
                if not service:
                    continue

                if stream_type == "note":
                    prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                elif stream_type == "chat":
                    physician_input = data.get("text", "")
                    discussion_history_text = "\n".join(
                        f"{entry.get('speaker', 'unknown')}: {entry.get('text', '')}"
                        for entry in session.discussion_history[-20:]
                    )
                    if isinstance(physician_input, str) and physician_input.strip():
                        session.add_discussion_entry("physician", physician_input.strip())
                    prompt = CONVERSATIONAL_CASE_DISCUSSION_PROMPT_TEMPLATE(
                        session.full_transcript,
                        session.current_draft_note,
                        session.current_ai_analysis,
                        physician_input,
                        discussion_history_text
                    )
                else:
                    custom_prompt = data.get("prompt")
                    prompt = custom_prompt if isinstance(custom_prompt, str) and custom_prompt.strip() else INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)

                try:
                    full_response = ""
                    async for chunk_text, is_done in service.stream_gemini_api(prompt, model_name=model_name_pref):
                        if chunk_text:
                            full_response += chunk_text
                            await websocket.send(json.dumps({
                                "type": "stream_chunk",
                                "text": chunk_text,
                                "done": bool(is_done),
                                "streamType": stream_type
                            }))

                        if is_done:
                            complete_payload = {
                                "type": "stream_complete",
                                "fullText": full_response,
                                "streamType": stream_type
                            }

                            if stream_type == "note":
                                note_text, analysis_text = service.parse_initial_generation(full_response)
                                session.update_draft_note(note_text)
                                session.update_ai_analysis(analysis_text)
                                complete_payload["noteText"] = note_text
                                complete_payload["analysisText"] = analysis_text
                            elif stream_type == "chat":
                                session.add_discussion_entry("ai", full_response)

                            await websocket.send(json.dumps(complete_payload))
                            break
                except Exception as e:
                    logger.error("Request failed (%s)", type(e).__name__)
                    await websocket.send(json.dumps({"type": "error", "area": "stream", "streamType": stream_type, "message": "Generation failed; provisional output was not saved. Please retry."}))


            elif message_type == "analyze_image":
                image_base64 = data.get("imageBase64")
                image_mime_type = data.get("imageMimeType")
                model_name = data.get("modelName", config.GEMINI_VISION_MODEL) 
                
                if not image_base64 or not image_mime_type:
                    await websocket.send(json.dumps({"type": "error", "message": "Image data missing for analysis."}))
                    continue

                await websocket.send(json.dumps({"type": "status", "message": "Analyzing image..."}))
                service = await ensure_gemini_service(websocket)
                if not service:
                    continue

                prompt_text = IMAGE_ANALYSIS_PROMPT_TEMPLATE 
                try:
                    description = await service.call_gemini_api(prompt_text, model_name=model_name, image_base64=image_base64, image_mime_type=image_mime_type)
                    await websocket.send(json.dumps({
                        "type": "image_analysis_result",
                        "description": description
                    }))
                except Exception as e:
                    logger.error("Request failed (%s)", type(e).__name__)
                    await websocket.send(json.dumps({"type": "error", "message": "AI operation failed; no new result was saved. Please retry."}))
            
            elif message_type == "integrate_image_description":
                description = data.get("description", "")
                if description:
                    session.add_image_description_to_transcript(description)
                    logger.info(f"Image description integrated for session {current_session_id_to_use}. Triggering regeneration.")
                    await websocket.send(json.dumps({"type": "status", "message": "Regenerating note and analysis with image info..."}))
                    service = await ensure_gemini_service(websocket)
                    if not service:
                        continue

                    prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                    try:
                        response_text = await service.call_gemini_api(prompt, model_name=data.get("modelName", config.GEMINI_DEFAULT_MODEL))
                        note_text, analysis_text = service.parse_initial_generation(response_text)
                        session.update_draft_note(note_text)
                        session.update_ai_analysis(analysis_text)
                        await websocket.send(json.dumps({
                            "type": "initial_generation_complete", 
                            "draftNote": note_text,
                            "aiAnalysis": analysis_text,
                            "message": "Note and analysis updated with image findings."
                        }))
                    except Exception as e:
                        logger.error("Request failed (%s)", type(e).__name__)
                        await websocket.send(json.dumps({"type": "error", "message": "AI operation failed; no new result was saved. Please retry."}))

            elif message_type == "discussion_input":
                physician_input = data.get("text", "")
                model_name_pref = data.get("modelName", config.GEMINI_DEFAULT_MODEL)
                transcript_override = data.get("transcript")
                intent = data.get("intent")

                if isinstance(transcript_override, str) and transcript_override.strip():
                    session.full_transcript = transcript_override.strip()

                discussion_history_text = "\n".join(
                    f"{entry.get('speaker', 'unknown')}: {entry.get('text', '')}"
                    for entry in session.discussion_history[-20:]
                )

                if isinstance(physician_input, str) and physician_input.strip():
                    session.add_discussion_entry("physician", physician_input.strip())

                await websocket.send(json.dumps({"type": "status", "message": "AI is processing your input..."}))

                service = await ensure_gemini_service(websocket)
                if not service:
                    continue

                conv_prompt = CONVERSATIONAL_CASE_DISCUSSION_PROMPT_TEMPLATE(
                    session.full_transcript,
                    session.current_draft_note,
                    session.current_ai_analysis,
                    physician_input,
                    discussion_history_text
                )

                try:
                    ai_response_text = await service.call_gemini_api(conv_prompt, model_name=model_name_pref)
                    session.add_discussion_entry("ai", ai_response_text)
                    await websocket.send(json.dumps({
                        "type": "discussion_response",
                        "text": ai_response_text
                    }))

                    # For certain UI intents (e.g., management plan generation), we want the AI response
                    # but we *do not* want to automatically regenerate notes/analysis.
                    if intent in ("management_plan", "general_question"):
                        continue

                    lower_ai_response = ai_response_text.lower()
                    new_info_keywords_in_ai_response = [
                        "will update the note and analysis",
                        "updating the note and analysis",
                        "regenerating with new information",
                        "i've updated the note and analysis",
                        "i will update both",
                    ]
                    note_update_keywords_in_ai_response = [
                        "will update the clinical note",
                        "updating the clinical note",
                        "i've updated the clinical note",
                    ]

                    physician_new_info_keywords = [
                        "patient also reports",
                        "new finding:",
                        "update on symptoms:",
                        "i forgot to mention:",
                        "add to history:",
                        "observed that:",
                        "test result shows",
                        "labs are back",
                        "correction to symptoms",
                        "additional detail is",
                        "the image shows",
                    ]

                    should_regenerate_all = any(k in lower_ai_response for k in new_info_keywords_in_ai_response) or any(
                        k in physician_input.lower() for k in physician_new_info_keywords
                    )

                    should_update_note_only = any(k in lower_ai_response for k in note_update_keywords_in_ai_response) and not should_regenerate_all

                    if should_regenerate_all:
                        logger.info(f"Discussion triggered full regeneration for session {current_session_id_to_use}")
                        session.add_transcript_segment(
                            f"\n\n--- PHYSICIAN INPUT (DISCUSSION LEADING TO REGEN) ---\n{physician_input}\n--- END PHYSICIAN INPUT ---\n",
                            True
                        )

                        regen_prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                        regen_response_text = await service.call_gemini_api(regen_prompt, model_name=model_name_pref)
                        new_note, new_analysis = service.parse_initial_generation(regen_response_text)
                        session.update_draft_note(new_note)
                        session.update_ai_analysis(new_analysis)
                        await websocket.send(json.dumps({
                            "type": "initial_generation_complete",
                            "draftNote": new_note,
                            "aiAnalysis": new_analysis,
                            "updateSource": "discussion_input_regen_all"
                        }))
                    elif should_update_note_only:
                        logger.info(f"Discussion triggered note refinement for session {current_session_id_to_use}")
                        ref_prompt = NOTE_REFINEMENT_PROMPT_TEMPLATE(session.full_transcript, session.current_draft_note, physician_input)
                        refined_note = await service.call_gemini_api(ref_prompt, model_name=model_name_pref)
                        session.update_draft_note(refined_note)
                        await websocket.send(json.dumps({
                            "type": "note_updated",
                            "draftNote": refined_note
                        }))

                except Exception as e:
                    logger.error("Request failed (%s)", type(e).__name__)
                    await websocket.send(json.dumps({"type": "error", "message": "AI operation failed; no new result was saved. Please retry."}))
            
            elif message_type == "request_session_data_for_save":
                logger.info(f"Client {current_session_id_to_use} requested session data for saving.")
                patient_id = data.get("patientId", "UnknownPatient") 
                visit_date = data.get("visitDate", "UnknownDate")   
                
                await websocket.send(json.dumps({
                    "type": "session_data_response",
                    "patientId": patient_id,
                    "visitDate": visit_date, 
                    "duration": session.get_formatted_duration(),
                    "transcript": session.full_transcript,
                    "aiClinicalNote": session.current_draft_note,
                    "aiAnalysis": session.current_ai_analysis
                }))

            else:
                logger.warning("Unknown message type received")
                await websocket.send(json.dumps({"type": "error", "message": "Unknown message type."}))
                continue

            duration_ms = int((time.perf_counter() - message_start) * 1000)
            log_event(
                "message_processed",
                session_id=session_id,
                client=client_key,
                message_type=message_type,
                latency_ms=duration_ms,
                rate_limit=rate_limiter.snapshot().get(client_key, {})
            )

    except websockets.exceptions.ConnectionClosedOK:
        logger.info(f"Client disconnected: {websocket.remote_address}, Session ID: {session_id}")
    except websockets.exceptions.ConnectionClosedError as e:
        logger.error("Request failed (%s)", type(e).__name__)
    except Exception as e:
        logger.error("Request failed (%s)", type(e).__name__)
        try:
            await websocket.send(json.dumps({"type": "error", "message": "An unexpected server error occurred."}))
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Connection already closed.")
    finally:
        if session_id:
            session_manager.remove_session(session_id)
        await cancel_suggestions()
        if session_id:
            log_event("session_cleanup", session_id=session_id, client=client_key, rate_limit=rate_limiter.snapshot().get(client_key, {}))

async def trigger_realtime_suggestions(websocket, session_id, client_model_pref=None):
    session = session_manager.get_session(session_id)
    if not session or not session.full_transcript.strip():
        return

    generation = session.generation
    recent_context_chars = 1000 
    transcript_segment = session.full_transcript[-recent_context_chars:]

    if not transcript_segment.strip():
        return

    service = get_gemini_service()
    if service is None:
        await websocket.send(json.dumps({
            "type": "error",
            "area": "suggestions",
            "message": "Gemini API key is not configured on the server. Suggestions unavailable."
        }))
        return

    logger.info(f"Triggering real-time suggestion for session {session_id}")
    await websocket.send(json.dumps({"type": "status", "area": "suggestions", "message": "AI thinking of suggestions..."}))
    
    prompt = REALTIME_SUGGESTION_PROMPT_TEMPLATE(transcript_segment, list(session.shown_suggestion_texts))
    try:
        suggestion_model = client_model_pref if client_model_pref else config.GEMINI_SUGGESTION_MODEL
        suggestions_text = await service.call_gemini_api(prompt, model_name=suggestion_model)
        if session_manager.get_session(session_id) is not session or session.generation != generation:
            return
        
        if suggestions_text and suggestions_text.strip().lower() != "no specific suggestions at this moment.":
            new_suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            unique_new_suggestions = []
            for sug_text in new_suggestions:
                clean_sug = sug_text.removeprefix("Suggestion:").strip().removeprefix("- ").strip()
                if clean_sug and clean_sug not in session.shown_suggestion_texts:
                    unique_new_suggestions.append(clean_sug)
                    session.shown_suggestion_texts.add(clean_sug) 
            
            if unique_new_suggestions:
                await websocket.send(json.dumps({
                    "type": "realtime_suggestions",
                    "suggestions": unique_new_suggestions
                }))
        else:
             await websocket.send(json.dumps({
                    "type": "realtime_suggestions",
                    "suggestions": [],
                    "message": "No specific suggestions at this moment."
                }))
    except Exception as e:
        if session_manager.get_session(session_id) is not session or session.generation != generation:
            return
        logger.error("Request failed (%s)", type(e).__name__)
        await websocket.send(json.dumps({"type": "error", "area": "suggestions", "message": "Error fetching suggestions."}))

def select_subprotocol(connection, offered_subprotocols):
    """
    Select a subprotocol to echo back to browser clients.

    Browsers may close the connection if they request subprotocols and the server doesn't
    select one. We support dynamic auth subprotocols of the form:
      ramie-auth.<base64url(token)>
    """
    for proto in offered_subprotocols or []:
        if isinstance(proto, str) and proto.startswith("ramie-auth."):
            return proto
    return None


async def main():
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8765)) 
    
    logger.info(f"Starting WebSocket server on {host}:{port}")
    async with websockets.serve(
        handler,
        host,
        port,
        max_size=10 * 1024 * 1024,  # Increased max_size for image data
        process_request=process_http_request,
        select_subprotocol=select_subprotocol,
    ):
        await asyncio.Future()

if __name__ == "__main__":
    if not config.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not found; AI functionality will be disabled until it is provided.")

    os.environ['PYTHONUNBUFFERED'] = '1'
    asyncio.run(main())
