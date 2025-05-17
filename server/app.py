# server/app.py
import asyncio
import websockets
import json
import os
import logging
from dotenv import load_dotenv

# Import local modules
import config # Ensure this is imported to use config.GEMINI_API_KEY
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
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env')) # Load .env from root

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize services
session_manager = SessionManager()
# gemini_api_key is now accessed via config.GEMINI_API_KEY
gemini_service = GeminiService(api_key=config.GEMINI_API_KEY)

# --- WebSocket Handler ---
async def handler(websocket, path=None): # Made 'path' argument optional
    """
    Handles WebSocket connections and messages from clients.
    The 'path' argument is expected by websockets.serve, but made optional here
    to handle potential invocation issues on some platforms.
    """
    session_id = None
    try:
        # Create a new session for this connection
        session_id = session_manager.create_session()
        logger.info(f"Client connected: {websocket.remote_address}, Path: {path}, Session ID: {session_id}")
        await websocket.send(json.dumps({"type": "connection_ack", "sessionId": session_id, "message": "Connected to AI Scribe Server"}))

        async for message_str in websocket:
            message = json.loads(message_str)
            message_type = message.get("type")
            data = message.get("data", {})
            client_session_id = data.get("sessionId", session_id) 

            if client_session_id != session_id and client_session_id is not None:
                logger.warning(f"Session ID mismatch. Expected {session_id}, got {client_session_id}.")
                # For simplicity, we'll proceed with the initial session_id.
                # In a more robust system, you might try to retrieve/validate the client_session_id.
            
            current_session_id_to_use = session_id # Use the one created at connection start

            session = session_manager.get_session(current_session_id_to_use)
            if not session:
                logger.error(f"Session {current_session_id_to_use} not found for client {websocket.remote_address}")
                await websocket.send(json.dumps({"type": "error", "message": "Session not found. Please reconnect."}))
                break

            logger.info(f"Received message type: {message_type} from {current_session_id_to_use}")

            if message_type == "transcript_segment":
                segment = data.get("segment", "")
                is_final = data.get("is_final", False)
                is_discussion_segment = data.get("is_discussion", False) # Check if it's from discussion mic

                if is_discussion_segment:
                    # If it's a discussion segment, we might not add it to the main transcript
                    # or handle it differently. For now, the client sends discussion input
                    # via "discussion_input" message type after its own STT.
                    # This "transcript_segment" with "is_discussion" might be if we decide
                    # to stream discussion mic audio to backend STT in the future.
                    # For now, we assume client handles STT for discussion and sends "discussion_input".
                    logger.info(f"Discussion transcript segment received for {current_session_id_to_use}: {segment}")
                else:
                    session.add_transcript_segment(segment, is_final)
                    if is_final and len(session.full_transcript.split()) > session.last_suggestion_word_count + config.GEMINI_SUGGESTION_MODEL.count("flash")*5 : # Heuristic for suggestion frequency
                        session.last_suggestion_word_count = len(session.full_transcript.split())
                        asyncio.create_task(trigger_realtime_suggestions(websocket, current_session_id_to_use, data.get("modelName")))


            elif message_type == "stop_finalize_recording":
                logger.info(f"Finalizing recording for session {current_session_id_to_use}")
                await websocket.send(json.dumps({"type": "status", "message": "Finalizing note and analysis..."}))
                prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                try:
                    response_text = await gemini_service.call_gemini_api(prompt, model_name=data.get("modelName", config.GEMINI_DEFAULT_MODEL))
                    note_text, analysis_text = gemini_service.parse_initial_generation(response_text)
                    session.update_draft_note(note_text)
                    session.update_ai_analysis(analysis_text)
                    await websocket.send(json.dumps({
                        "type": "initial_generation_complete",
                        "draftNote": note_text,
                        "aiAnalysis": analysis_text
                    }))
                except Exception as e:
                    logger.error(f"Error during final generation for {current_session_id_to_use}: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": f"Error generating final note/analysis: {str(e)}"}))

            elif message_type == "analyze_image":
                image_base64 = data.get("imageBase64")
                image_mime_type = data.get("imageMimeType")
                # Use client-preferred model if available, else default vision model
                model_name = data.get("modelName", config.GEMINI_VISION_MODEL) 
                
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
                    logger.error(f"Error during image analysis for {current_session_id_to_use}: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": f"Error analyzing image: {str(e)}"}))
            
            elif message_type == "integrate_image_description":
                description = data.get("description", "")
                if description:
                    session.add_image_description_to_transcript(description)
                    logger.info(f"Image description integrated for session {current_session_id_to_use}. Triggering regeneration.")
                    await websocket.send(json.dumps({"type": "status", "message": "Regenerating note and analysis with image info..."}))
                    prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                    try:
                        response_text = await gemini_service.call_gemini_api(prompt, model_name=data.get("modelName", config.GEMINI_DEFAULT_MODEL))
                        note_text, analysis_text = gemini_service.parse_initial_generation(response_text)
                        session.update_draft_note(note_text)
                        session.update_ai_analysis(analysis_text)
                        await websocket.send(json.dumps({
                            "type": "initial_generation_complete", 
                            "draftNote": note_text,
                            "aiAnalysis": analysis_text,
                            "message": "Note and analysis updated with image findings."
                        }))
                    except Exception as e:
                        logger.error(f"Error during regeneration after image integration for {current_session_id_to_use}: {e}")
                        await websocket.send(json.dumps({"type": "error", "message": f"Error regenerating after image: {str(e)}"}))


            elif message_type == "discussion_input":
                physician_input = data.get("text", "")
                model_name_pref = data.get("modelName", config.GEMINI_DEFAULT_MODEL)
                session.add_discussion_entry("physician", physician_input)
                
                await websocket.send(json.dumps({"type": "status", "message": "AI is processing your input..."}))

                conv_prompt = CONVERSATIONAL_CASE_DISCUSSION_PROMPT_TEMPLATE(
                    session.full_transcript,
                    session.current_draft_note,
                    session.current_ai_analysis,
                    physician_input
                )
                try:
                    ai_response_text = await gemini_service.call_gemini_api(conv_prompt, model_name=model_name_pref)
                    session.add_discussion_entry("ai", ai_response_text)
                    await websocket.send(json.dumps({
                        "type": "discussion_response",
                        "text": ai_response_text
                    }))

                    lower_ai_response = ai_response_text.lower()
                    new_info_keywords = ["will update the note and analysis", "updating the note and analysis", "regenerating with new information"]
                    note_update_keywords = ["will update the clinical note", "updating the clinical note"]
                    analysis_update_keywords = ["will update the ai analysis", "updating the ai analysis"]

                    should_regenerate_all = any(k in lower_ai_response for k in new_info_keywords)
                    should_update_note_only = any(k in lower_ai_response for k in note_update_keywords) and not should_regenerate_all
                    should_update_analysis_only = any(k in lower_ai_response for k in analysis_update_keywords) and not should_regenerate_all


                    if should_regenerate_all:
                        logger.info(f"Discussion triggered full regeneration for session {current_session_id_to_use}")
                        session.add_transcript_segment(f"\n\n--- PHYSICIAN INPUT (DISCUSSION LEADING TO REGEN) ---\n{physician_input}\n--- END PHYSICIAN INPUT ---\n", True)
                        regen_prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(session.full_transcript)
                        regen_response_text = await gemini_service.call_gemini_api(regen_prompt, model_name=model_name_pref)
                        new_note, new_analysis = gemini_service.parse_initial_generation(regen_response_text)
                        session.update_draft_note(new_note)
                        session.update_ai_analysis(new_analysis)
                        await websocket.send(json.dumps({
                            "type": "initial_generation_complete",
                            "draftNote": new_note,
                            "aiAnalysis": new_analysis,
                            "updateSource": "discussion_input_regen_all"
                        }))
                    else:
                        if should_update_note_only:
                            logger.info(f"Discussion triggered note refinement for session {current_session_id_to_use}")
                            ref_prompt = NOTE_REFINEMENT_PROMPT_TEMPLATE(session.full_transcript, session.current_draft_note, physician_input)
                            refined_note = await gemini_service.call_gemini_api(ref_prompt, model_name=model_name_pref)
                            session.update_draft_note(refined_note)
                            await websocket.send(json.dumps({
                                "type": "note_updated",
                                "draftNote": refined_note
                            }))
                        if should_update_analysis_only: # This might need a more specific trigger
                            logger.info(f"Discussion triggered AI analysis refinement for session {current_session_id_to_use}")
                            # Add physician input to transcript for context if it's for analysis refinement
                            session.add_transcript_segment(f"\n\n--- PHYSICIAN QUERY FOR ANALYSIS REFINEMENT ---\n{physician_input}\n--- END PHYSICIAN QUERY ---\n", True)
                            analysis_ref_prompt = AI_ANALYSIS_REFINEMENT_PROMPT_TEMPLATE(session.full_transcript, session.current_ai_analysis, physician_input)
                            refined_analysis = await gemini_service.call_gemini_api(analysis_ref_prompt, model_name=model_name_pref)
                            session.update_ai_analysis(refined_analysis)
                            await websocket.send(json.dumps({
                                "type": "analysis_updated",
                                "aiAnalysis": refined_analysis
                            }))

                except Exception as e:
                    logger.error(f"Error during discussion processing for {current_session_id_to_use}: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": f"Error in discussion: {str(e)}"}))
            
            elif message_type == "request_session_data_for_save":
                # This is a client request, server can send back data for client to handle download
                # Or server could save it to a database/file if that functionality is added
                logger.info(f"Client {current_session_id_to_use} requested session data for saving.")
                await websocket.send(json.dumps({
                    "type": "session_data_response",
                    "patientId": "P00123", # Placeholder, get from session if stored
                    "visitDate": "2024-05-17", # Placeholder
                    "duration": session.timer_duration_formatted_on_stop if hasattr(session, 'timer_duration_formatted_on_stop') else "00:00:00",
                    "transcript": session.full_transcript,
                    "aiClinicalNote": session.current_draft_note,
                    "aiAnalysis": session.current_ai_analysis
                }))


            else:
                logger.warning(f"Unknown message type received: {message_type} from {current_session_id_to_use}")
                await websocket.send(json.dumps({"type": "error", "message": f"Unknown message type: {message_type}"}))

    except websockets.exceptions.ConnectionClosedOK:
        logger.info(f"Client disconnected: {websocket.remote_address}, Session ID: {session_id}")
    except websockets.exceptions.ConnectionClosedError as e:
        logger.error(f"Client connection closed with error: {websocket.remote_address}, Session ID: {session_id}, Error: {e}")
    except Exception as e:
        logger.error(f"Unhandled error in WebSocket handler for session {session_id}: {e}", exc_info=True)
        if websocket.open: # Check if socket is still open before trying to send
            try:
                await websocket.send(json.dumps({"type": "error", "message": "An unexpected server error occurred."}))
            except websockets.exceptions.ConnectionClosed:
                logger.warning(f"Could not send error to {session_id}, connection already closed.")
    finally:
        if session_id:
            session_manager.remove_session(session_id)
            logger.info(f"Session {session_id} cleaned up.")

async def trigger_realtime_suggestions(websocket, session_id, client_model_pref=None):
    session = session_manager.get_session(session_id)
    if not session or not session.full_transcript.strip() or not config.GEMINI_API_KEY:
        return

    # Use a segment of the transcript for suggestions
    recent_context_chars = 1000 
    transcript_segment = session.full_transcript[-recent_context_chars:]

    if not transcript_segment.strip():
        return
        
    logger.info(f"Triggering real-time suggestion for session {session_id}")
    await websocket.send(json.dumps({"type": "status", "area": "suggestions", "message": "AI thinking of suggestions..."}))
    
    prompt = REALTIME_SUGGESTION_PROMPT_TEMPLATE(transcript_segment, list(session.shown_suggestion_texts))
    try:
        suggestion_model = client_model_pref if client_model_pref else config.GEMINI_SUGGESTION_MODEL
        suggestions_text = await gemini_service.call_gemini_api(prompt, model_name=suggestion_model)
        
        if suggestions_text and suggestions_text.strip().lower() != "no specific suggestions at this moment.":
            new_suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            unique_new_suggestions = []
            for sug_text in new_suggestions:
                clean_sug = sug_text.replace("Suggestion:", "").replace("-","").strip()
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
        logger.error(f"Error fetching real-time suggestions for {session_id}: {e}")
        await websocket.send(json.dumps({"type": "error", "area": "suggestions", "message": "Error fetching suggestions."}))


async def main():
    host = "0.0.0.0"
    port = int(os.getenv("PORT", 8765)) 
    
    logger.info(f"Starting WebSocket server on {host}:{port}")
    async with websockets.serve(handler, host, port, max_size=10*1024*1024): # Increased max_size for image data
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    if not config.GEMINI_API_KEY: 
        logger.error("GEMINI_API_KEY not found in environment variables or .env file. Please set it.")
    else:
        os.environ['PYTHONUNBUFFERED'] = '1' 
        asyncio.run(main())
