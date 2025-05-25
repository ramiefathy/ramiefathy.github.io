import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

# --- Mock Orchestrator for demonstration within this file ---
# In a real multi-agent system, this would be an actual import:
# e.g., from services.orchestrator import orchestrator_instance
class MockOrchestrator:
    def start_document_processing(self, file_path, job_id, api_key=None):
        """
        Simulates the initiation of document processing by the Orchestrator Agent.
        In a production setup, this would enqueue a background task (e.g., using Celery).
        """
        print(f"DEBUG: MockOrchestrator: Starting processing for job_id='{job_id}', file='{file_path}'. API Key provided: {bool(api_key)}")
        # This function would typically send a message to a queue that the
        # Orchestrator_Agent is listening to, containing the file_path, job_id, and api_key.
        pass

# Instantiate the mock orchestrator. This should be replaced with a proper
# dependency injection or import from the actual orchestrator module.
orchestrator = MockOrchestrator()
# -----------------------------------------------------------

document_bp = Blueprint('document', __name__)

@document_bp.route('/upload-document', methods=['POST'])
def upload_document():
    """
    API endpoint to handle PDF document uploads and trigger background processing.

    Expects a multipart/form-data request with a file named 'document'.
    An 'X-API-Key' header can be provided for downstream LLM services.
    """
    # 1. Check if a file part is present in the request
    if 'document' not in request.files:
        return jsonify({"error": "No 'document' file part in the request"}), 400

    file = request.files['document']

    # 2. Check if a file was actually selected
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # 3. Validate file type (only PDFs are allowed as per project description)
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

    # 4. Extract API Key from headers for downstream LLM services
    # The Backend_API_Agent is responsible for initial validation/handling,
    # then passing it to the Orchestrator for further use by other agents.
    api_key = request.headers.get('X-API-Key')
    if not api_key:
        # Log a warning as the API key is crucial for LLM-powered features.
        # Depending on strictness, this could be a 401 error.
        current_app.logger.warning("X-API-Key header was not provided. LLM-powered features may be limited or unavailable.")

    if file:
        try:
            # 5. Generate a unique filename and secure the original filename
            # This prevents overwriting and mitigates path traversal issues.
            unique_filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
            
            # 6. Determine the upload folder path from Flask's current_app configuration
            # It is assumed that the main Flask application (e.g., app.py)
            # will have configured app.config['UPLOADS_FOLDER'].
            uploads_folder = current_app.config.get('UPLOADS_FOLDER')
            if not uploads_folder:
                current_app.logger.error("UPLOADS_FOLDER is not configured in Flask app. Cannot save file.")
                return jsonify({"error": "Server configuration error: Uploads folder not defined."}), 500

            # Ensure the upload directory exists
            os.makedirs(uploads_folder, exist_ok=True)

            # 7. Construct the full path to save the file and save it to disk
            file_path = os.path.join(uploads_folder, unique_filename)
            file.save(file_path)

            # 8. Generate a unique job ID for tracking this specific processing task
            job_id = str(uuid.uuid4())

            # 9. Trigger the Orchestrator Agent for background processing
            # This offloads the heavy lifting (PDF parsing, NLP) to a separate process/agent.
            orchestrator.start_document_processing(file_path, job_id, api_key)

            current_app.logger.info(f"Document '{unique_filename}' uploaded successfully to '{file_path}'. Processing initiated with job_id: {job_id}")
            
            # 10. Return a 202 Accepted response, indicating asynchronous processing has started
            return jsonify({
                "message": "Document uploaded and processing workflow initiated successfully.",
                "job_id": job_id,
                "filename": unique_filename,
                "status_url": f"/api/documents/status/{job_id}" # Placeholder for a future status endpoint
            }), 202

        except Exception as e:
            # Log the full exception details for debugging purposes
            current_app.logger.exception(f"An unexpected error occurred during document upload or processing initiation: {e}")
            return jsonify({"error": f"An internal server error occurred: {str(e)}. Please try again later."}), 500