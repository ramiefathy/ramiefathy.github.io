import os
from flask import Blueprint, request, jsonify, session
import logging

# Assume security_utils.py exists and provides functions for secure API key handling.
# In a multi-agent system, security_utils would encapsulate interactions with the SecurityAgent.
try:
    from ..utils import security_utils
except ImportError:
    # Fallback for direct execution/testing if not run as part of a package.
    # In a real deployed application, this should never be hit if package structure is correct.
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from utils import security_utils

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__) # Logger configured globally in app.py or equivalent

def _test_llm_api_key(api_key: str) -> bool:
    """
    Simulates a test call to an external LLM API to validate the key.
    In a production system, this would make an actual, lightweight API call
    (e.g., listing available models, a tiny dummy prompt) to the LLM service
    (e.g., Google Gemini, OpenAI) to ensure the key's validity and functionality.
    It should be designed to be cheap and fast.
    """
    if not api_key:
        return False
    
    # --- PLACEHOLDER FOR ACTUAL LLM API VALIDATION ---
    # Example for Google Generative AI (requires `google-generativeai` package):
    # try:
    #     import google.generativeai as genai
    #     genai.configure(api_key=api_key)
    #     # Attempt a simple operation, e.g., listing models or a very short generation
    #     list(genai.list_models()) # Check if models can be listed
    #     logger.info("Actual LLM API key validation successful.")
    #     return True
    # except Exception as e:
    #     logger.warning(f"Actual LLM API key validation failed: {e}")
    #     return False
    
    # For development and demonstration purposes, a simple check:
    # A real key should be longer and pass an actual API call.
    if len(api_key) < 10: # Arbitrary minimum length
        logger.warning(f"Simulated LLM API key validation failed: key too short.")
        return False
    
    logger.info(f"Simulated LLM API key validation successful for key ending with: ...{api_key[-4:]}")
    return True
    # --- END PLACEHOLDER ---

@auth_bp.route('/submit-key', methods=['POST'])
def submit_api_key():
    """
    Defines the API endpoint for users to submit their external LLM API key.
    The key is validated and then securely stored in the session by security_utils.
    """
    data = request.get_json()
    api_key = data.get('apiKey')

    if not api_key:
        logger.warning("Attempted to submit empty or missing API key.")
        return jsonify({"message": "API key is required"}), 400

    # Step 1: Validate the API key using a test call to the LLM service
    is_valid = _test_llm_api_key(api_key)

    if not is_valid:
        logger.warning(f"Submitted LLM API key failed validation (ends with: ...{api_key[-4:]}).")
        return jsonify({"message": "Invalid or unusable API key. Please check your key and ensure it has necessary permissions."}), 401

    # Step 2: If valid, securely store the key in the session
    try:
        security_utils.set_llm_api_key_for_session(api_key)
        logger.info(f"LLM API key successfully submitted and secured for session (ends with: ...{api_key[-4:]}).")
        return jsonify({"message": "API key submitted and validated successfully.", "status": "valid"}), 200
    except Exception as e:
        logger.exception("Error securing LLM API key in session.")
        return jsonify({"message": f"Internal server error securing API key: {str(e)}"}), 500

@auth_bp.route('/key-status', methods=['GET'])
def get_key_status():
    """
    Defines the API endpoint to check if an LLM API key is present and active
    in the current user's session without exposing the key itself.
    """
    try:
        api_key = security_utils.get_llm_api_key_from_session()
        if api_key:
            # Optionally, re-validate the key periodically or on critical operations
            # For now, just check presence as it was validated on submission.
            logger.info("LLM API key found in session.")
            return jsonify({"message": "API key is active for this session.", "status": "active"}), 200
        else:
            logger.info("No LLM API key found in session.")
            return jsonify({"message": "No API key found for this session.", "status": "inactive"}), 404
    except Exception as e:
        logger.exception("Error checking LLM API key status from session.")
        return jsonify({"message": f"Internal server error checking API key status: {str(e)}"}), 500

@auth_bp.route('/clear-key', methods=['POST'])
def clear_api_key():
    """
    Defines the API endpoint to explicitly clear the LLM API key from the
    current user's session.
    """
    try:
        security_utils.clear_llm_api_key_from_session()
        logger.info("LLM API key successfully cleared from session.")
        return jsonify({"message": "API key cleared successfully."}), 200
    except Exception as e:
        logger.exception("Error clearing LLM API key from session.")
        return jsonify({"message": f"Internal server error clearing API key: {str(e)}"}), 500

@auth_bp.route('/check-server-config', methods=['GET'])
def check_server_config():
    """
    An internal endpoint (can be protected in production) to check critical server-side
    configurations related to security, e.g., if Flask's SECRET_KEY is set for sessions.
    """
    # Flask's SECRET_KEY is crucial for secure session management.
    # It can be set via FLASK_SECRET_KEY environment variable or app.secret_key.
    if not request.app.secret_key: # This checks if the secret_key was set on the Flask app instance
        logger.error("Flask SECRET_KEY is not set. Session security might be compromised.")
        return jsonify({"message": "Server configuration error: FLASK_SECRET_KEY is not set. Session security might be compromised.", "status": "error"}), 500
    
    logger.info("Server session configuration appears secure (SECRET_KEY is set).")
    return jsonify({"message": "Server session configuration appears OK.", "status": "ok"}), 200