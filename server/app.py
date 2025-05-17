# server/app.py
import asyncio
import websockets
import json
import os
import logging
from dotenv import load_dotenv

# Import local modules
import config
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

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize services
session_manager = SessionManager()
gemini_api_key = config.GEMINI_API_KEY
gemini_service = GeminiService(api_key=gemini_api_key)

# --- WebSocket Handler ---
async def handler(websocket, path):
    """
    Handles WebSocket connections and messages from clients.
    """
    session_id = None
    try:
        # Create a new session for this connection
        session_id = session_manager.create_session()
        logger.info(f"Client connected: {websocket.remote_address}, Session ID: {session_id}")
        await websocket.send(json.dumps({"type": "connection_ack", "sessionId": session_id, "message": "Connected to AI Scribe Server"}))

        async for message_str in websocket:
            message = json.loads(message_str)
            message_type = message.get("type")
            data = message.get("data", {})
            client_session_id = data.get("sessionId", session_id) # Use session ID from message if provided

            if client_session_id != session_id and client_session_id is not None:
                logger.warning(f"Session ID mismatch. Expected {session_id}, got {client_session_id}. Ignoring message or re-assigning.")
                # Potentially handle session recovery or error, for now, we'll use the initial session_id
                # Or, if this is a reconnect, try to retrieve the old session:
                # if not session_manager.get_session(client_session_id):
                #     await websocket.send(json.dumps({"type": "error", "message": "Session expired or invalid."}))
                #     continue # Or break
                # session_id = client_session_id # Re-assign if allowing reconnection with old ID

            session = session_manager.get_session(session_id)
            if not session:
                logger.error(f"Session {session_id} not found for client {websocket.remote_address}")
                await websocket.send(json.dumps({"type": "error", "message": "Session not found. Please reconnect."}))
                break

            logger.info(f"Received message type: {message_type} from {session_id}")

            if message_type == "transcript_segment":
                segment = data.get("segment", "")
                is_final = data.get("is_final", False)
                session.add_transcript_segment(segment, is_final)
                # logger.debug(f"Session {session_id} transcript updated: ...{session.full_transcript[-100:]}")

                # Potentially trigger real-time suggestions
                if is_final and len(session.full_transcript.split()) > session.last_suggestion_word_count + 20: # Trigger every ~20 new words
                    session.last_suggestion_word_count = len(session.full_transcript.split())
                    asyncio.create_task(trigger_realtime_suggestions(websocket, session_id))


            elif message_type == "stop_finalize_recording":
                logger.info(f"Finalizing recording for session {session_id}")
                await websocket.send(json.dumps({"type": "status", "message": "Finalizing note and analysis..."}))
                prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                try:
                    response_text = await gemini_service.call_gemini_api(prompt, model_name=data.get("modelName"))
                    note_text, analysis_text = gemini_service.parse_initial_generation(response_text)
                    session.update_draft_note(note_text)
                    session.update_ai_analysis(analysis_text)
                    await websocket.send(json.dumps({
                        "type": "initial_generation_complete",
                        "draftNote": note_text,
                        "aiAnalysis": analysis_text
                    }))
                except Exception as e:
                    logger.error(f"Error during final generation for {session_id}: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": f"Error generating final note/analysis: {str(e)}"}))

            elif message_type == "analyze_image":
                image_base64 = data.get("imageBase64")
                image_mime_type = data.get("imageMimeType")
                model_name = data.get("modelName", "models/gemini-2.5-flash-preview-04-17") # Default to vision model
                
                if not image_base64 or not image_mime_type:
                    await websocket.send(json.dumps({"type": "error", "message": "Image data missing for analysis."}))
                    continue

                await websocket.send(json.dumps({"type": "status", "message": "Analyzing image..."}))
                prompt = IMAGE_ANALYSIS_PROMPT_TEMPLATE
                try:
                    description = await gemini_service.call_gemini_api(prompt, model_name=model_name, image_base64=image_base64, image_mime_type=image_mime_type)
                    await websocket.send(json.dumps({
                        "type": "image_analysis_result",
                        "description": description
                    }))
                except Exception as e:
                    logger.error(f"Error during image analysis for {session_id}: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": f"Error analyzing image: {str(e)}"}))
            
            elif message_type == "integrate_image_description":
                description = data.get("description", "")
                if description:
                    session.add_image_description_to_transcript(description)
                    logger.info(f"Image description integrated for session {session_id}. Triggering regeneration.")
                    # Regenerate note and analysis with the updated transcript
                    await websocket.send(json.dumps({"type": "status", "message": "Regenerating note and analysis with image info..."}))
                    prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                    try:
                        response_text = await gemini_service.call_gemini_api(prompt, model_name=data.get("modelName"))
                        note_text, analysis_text = gemini_service.parse_initial_generation(response_text)
                        session.update_draft_note(note_text)
                        session.update_ai_analysis(analysis_text)
                        await websocket.send(json.dumps({
                            "type": "initial_generation_complete", # Send as initial to update both sections
                            "draftNote": note_text,
                            "aiAnalysis": analysis_text,
                            "message": "Note and analysis updated with image findings."
                        }))
                    except Exception as e:
                        logger.error(f"Error during regeneration after image integration for {session_id}: {e}")
                        await websocket.send(json.dumps({"type": "error", "message": f"Error regenerating after image: {str(e)}"}))


            elif message_type == "discussion_input":
                physician_input = data.get("text", "")
                model_name = data.get("modelName")
                session.add_discussion_entry("physician", physician_input)
                
                await websocket.send(json.dumps({"type": "status", "message": "AI is processing your input..."}))

                # Get conversational response
                conv_prompt = CONVERSATIONAL_CASE_DISCUSSION_PROMPT_TEMPLATE(
                    session.full_transcript,
                    session.current_draft_note,
                    session.current_ai_analysis,
                    physician_input
                )
                try:
                    ai_response_text = await gemini_service.call_gemini_api(conv_prompt, model_name=model_name)
                    session.add_discussion_entry("ai", ai_response_text)
                    await websocket.send(json.dumps({
                        "type": "discussion_response",
                        "text": ai_response_text
                    }))

                    # Determine if updates are needed based on AI's response or keywords
                    # This logic can be refined based on how reliably the AI indicates updates
                    if "will update the note and analysis" in ai_response_text.lower() or \
                       any(k in physician_input.lower() for k in ["new finding:", "patient also reports", "labs are back"]):
                        logger.info(f"Discussion input triggered update for note and analysis for session {session_id}")
                        session.add_transcript_segment(f"\n\n--- PHYSICIAN INPUT (DISCUSSION) ---\n{physician_input}\n--- END PHYSICIAN INPUT ---\n", True)
                        
                        # Regenerate both note and analysis
                        regen_prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                        regen_response_text = await gemini_service.call_gemini_api(regen_prompt, model_name=model_name)
                        new_note, new_analysis = gemini_service.parse_initial_generation(regen_response_text)
                        session.update_draft_note(new_note)
                        session.update_ai_analysis(new_analysis)
                        await websocket.send(json.dumps({
                            "type": "initial_generation_complete", # To update both client sections
                            "draftNote": new_note,
                            "aiAnalysis": new_analysis,
                            "updateSource": "discussion_input"
                        }))

                    elif "will update the clinical note" in ai_response_text.lower() or \
                         any(k in physician_input.lower() for k in ["correct the note:", "change the assessment to"]):
                        logger.info(f"Discussion input triggered note refinement for session {session_id}")
                        ref_prompt = NOTE_REFINEMENT_PROMPT_TEMPLATE(session.full_transcript, session.current_draft_note, physician_input)
                        refined_note = await gemini_service.call_gemini_api(ref_prompt, model_name=model_name)
                        session.update_draft_note(refined_note)
                        await websocket.send(json.dumps({
                            "type": "note_updated",
                            "draftNote": refined_note
                        }))
                    
                    # Add similar logic for AI Analysis refinement if needed, based on AI response or keywords

                except Exception as e:
                    logger.error(f"Error during discussion processing for {session_id}: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": f"Error in discussion: {str(e)}"}))
            
            else:
                logger.warning(f"Unknown message type received: {message_type} from {session_id}")
                await websocket.send(json.dumps({"type": "error", "message": f"Unknown message type: {message_type}"}))

    except websockets.exceptions.ConnectionClosedOK:
        logger.info(f"Client disconnected: {websocket.remote_address}, Session ID: {session_id}")
    except websockets.exceptions.ConnectionClosedError as e:
        logger.error(f"Client connection closed with error: {websocket.remote_address}, Session ID: {session_id}, Error: {e}")
    except Exception as e:
        logger.error(f"Unhandled error in WebSocket handler for session {session_id}: {e}", exc_info=True)
        if websocket.open:
            await websocket.send(json.dumps({"type": "error", "message": "An unexpected server error occurred."}))
    finally:
        if session_id:
            session_manager.remove_session(session_id)
            logger.info(f"Session {session_id} cleaned up.")

async def trigger_realtime_suggestions(websocket, session_id):
    session = session_manager.get_session(session_id)
    if not session or not session.full_transcript.strip():
        return

    # Use a segment of the transcript for suggestions
    # transcript_segment = " ".join(session.full_transcript.split()[-150:]) # Last 150 words
    # More robust: take last few sentences or a character limit
    recent_context_chars = 1000 
    transcript_segment = session.full_transcript[-recent_context_chars:]

    if not transcript_segment.strip():
        return
        
    logger.info(f"Triggering real-time suggestion for session {session_id}")
    await websocket.send(json.dumps({"type": "status", "area": "suggestions", "message": "AI thinking of suggestions..."}))
    
    prompt = REALTIME_SUGGESTION_PROMPT_TEMPLATE(transcript_segment, list(session.shown_suggestion_texts))
    try:
        # Use a potentially faster model for suggestions if configured, else default
        suggestion_model = os.getenv("GEMINI_SUGGESTION_MODEL", config.GEMINI_DEFAULT_MODEL) 
        suggestions_text = await gemini_service.call_gemini_api(prompt, model_name=suggestion_model)
        
        if suggestions_text and suggestions_text.strip().lower() != "no specific suggestions at this moment.":
            new_suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            unique_new_suggestions = []
            for sug_text in new_suggestions:
                clean_sug = sug_text.replace("Suggestion:", "").replace("-","").strip()
                if clean_sug and clean_sug not in session.shown_suggestion_texts:
                    unique_new_suggestions.append(clean_sug)
                    session.shown_suggestion_texts.add(clean_sug) # Add to session's shown suggestions
            
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
        logger.error(f"Error fetching real-time suggestions for {session_id}: {e}")
        await websocket.send(json.dumps({"type": "error", "area": "suggestions", "message": "Error fetching suggestions."}))


async def main():
    # Render sets the PORT environment variable.
    # It also expects to bind to 0.0.0.0
    host = "0.0.0.0"
    port = int(os.getenv("PORT", 8765)) # Default to 8765 if PORT not set locally
    
    logger.info(f"Starting WebSocket server on {host}:{port}")
    async with websockets.serve(handler, host, port):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    if not gemini_api_key:
        logger.error("GEMINI_API_KEY not found in environment variables or .env file. Please set it.")
    else:
        # Ensure PYTHONUNBUFFERED is set for Render logging
        os.environ['PYTHONUNBUFFERED'] = '1' 
        asyncio.run(main())

if __name__ == "__main__":
    if not gemini_api_key:
        logger.error("GEMINI_API_KEY not found in environment variables or .env file. Please set it.")
    else:
        asyncio.run(main())
