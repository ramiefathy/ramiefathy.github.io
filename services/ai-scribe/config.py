# server/config.py
import os
from dotenv import load_dotenv

# Load environment variables from .env file at the project root (if it exists)
# This allows .env to be outside the server directory for easier management.
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else: # Fallback to .env in the same directory as this config file (server/.env)
    load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Default model for text generation, can be overridden by client
GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_DEFAULT_MODEL", "models/gemini-2.0-flash-exp") 
# Specific model for image analysis, should be vision-capable
GEMINI_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "models/gemini-2.0-flash-exp") 
# Potentially a faster model for real-time suggestions
GEMINI_SUGGESTION_MODEL = os.getenv("GEMINI_SUGGESTION_MODEL", "models/gemini-2.0-flash-exp")

SESSION_SECRET = os.getenv("SESSION_SECRET", "development-token")
ALLOWED_ORIGINS = set(
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:4321").split(',')
    if origin.strip()
)

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. The application will not be able to connect to the Gemini API.")
