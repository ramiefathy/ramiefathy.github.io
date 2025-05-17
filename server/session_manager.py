# server/session_manager.py
import uuid
import logging

logger = logging.getLogger(__name__)

class Session:
    def __init__(self, session_id):
        self.session_id = session_id
        self.full_transcript = ""
        self.current_draft_note = ""
        self.current_ai_analysis = ""
        self.discussion_history = [] # List of {"speaker": "physician/ai", "text": "..."}
        self.shown_suggestion_texts = set() # To avoid repeating suggestions in a session
        self.last_suggestion_word_count = 0 # For controlling suggestion frequency
        logger.info(f"Session created: {session_id}")

    def add_transcript_segment(self, segment, is_final):
        # For now, we just append. More sophisticated logic could handle interim results replacement.
        if is_final:
            self.full_transcript += segment + " "
        # Else, if handling interim, you might store it differently or update a temporary buffer.
        # logger.debug(f"Transcript for {self.session_id} updated: ...{self.full_transcript[-200:]}")


    def add_image_description_to_transcript(self, description):
        self.full_transcript += f"\n\n--- CLINICAL IMAGE FINDINGS ---\n{description}\n--- END CLINICAL IMAGE FINDINGS ---\n"
        logger.info(f"Image description added to transcript for session {self.session_id}")

    def update_draft_note(self, note):
        self.current_draft_note = note
        logger.debug(f"Draft note updated for session {self.session_id}")

    def update_ai_analysis(self, analysis):
        self.current_ai_analysis = analysis
        logger.debug(f"AI analysis updated for session {self.session_id}")

    def add_discussion_entry(self, speaker, text):
        self.discussion_history.append({"speaker": speaker, "text": text})
        # Optionally, add physician's discussion input to the main transcript for context in future AI calls
        if speaker == "physician":
             self.full_transcript += f"\n\n--- PHYSICIAN INPUT (DISCUSSION) ---\n{text}\n--- END PHYSICIAN INPUT ---\n"


class SessionManager:
    def __init__(self):
        self.sessions = {}

    def create_session(self):
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = Session(session_id)
        return session_id

    def get_session(self, session_id):
        return self.sessions.get(session_id)

    def remove_session(self, session_id):
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Session removed: {session_id}")
        else:
            logger.warning(f"Attempted to remove non-existent session: {session_id}")

