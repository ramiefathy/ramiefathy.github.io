# server/session_manager.py
import uuid
import logging
import time # For timer duration

logger = logging.getLogger(__name__)

class Session:
    def __init__(self, session_id):
        self.session_id = session_id
        self.reset_session_data() # Initialize with reset
        logger.info(f"Session created: {session_id}")

    def reset_session_data(self):
        """Resets the data for a new recording/encounter within the same WebSocket session."""
        self.full_transcript = ""
        self.current_draft_note = ""
        self.current_ai_analysis = ""
        self.discussion_history = [] 
        self.shown_suggestion_texts = set() 
        self.last_suggestion_word_count = 0
        self.start_time = None # For recording duration
        self.timer_duration_formatted_on_stop = "00:00:00"
        logger.info(f"Session data reset for {self.session_id}")

    def start_timer(self):
        self.start_time = time.time()

    def stop_timer(self):
        if self.start_time:
            elapsed_seconds = int(time.time() - self.start_time)
            hours = elapsed_seconds // 3600
            minutes = (elapsed_seconds % 3600) // 60
            seconds = elapsed_seconds % 60
            self.timer_duration_formatted_on_stop = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        self.start_time = None # Reset start time

    def get_formatted_duration(self):
        return self.timer_duration_formatted_on_stop


    def add_transcript_segment(self, segment, is_final):
        if self.start_time is None and is_final and segment.strip(): # Start timer on first final segment
            self.start_timer()

        if is_final:
            self.full_transcript += segment + " "
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
        # This is now handled more explicitly in the app.py logic based on AI response/keywords
        # if speaker == "physician":
        #      self.full_transcript += f"\n\n--- PHYSICIAN INPUT (DISCUSSION) ---\n{text}\n--- END PHYSICIAN INPUT ---\n"


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
            session = self.sessions[session_id]
            if session.start_time: # Ensure timer is stopped if session is removed abruptly
                session.stop_timer()
            del self.sessions[session_id]
            logger.info(f"Session removed: {session_id}")
        else:
            logger.warning(f"Attempted to remove non-existent session: {session_id}")

