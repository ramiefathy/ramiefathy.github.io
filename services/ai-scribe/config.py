# server/config.py
import os
from dotenv import load_dotenv

# Load runtime configuration from services/ai-scribe/.env (if present).
#
# IMPORTANT: Avoid implicit dotenv discovery (e.g., searching parent directories or $HOME),
# because it makes behavior non-deterministic and can accidentally pull unrelated secrets
# from the developer machine.
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=False)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Select a currently available model explicitly after validating it for this deployment.
# Do not silently change a clinical workflow's model or fall back to a retired experiment.
GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_DEFAULT_MODEL", "").strip()
GEMINI_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "").strip() or GEMINI_DEFAULT_MODEL
GEMINI_SUGGESTION_MODEL = os.getenv("GEMINI_SUGGESTION_MODEL", "").strip() or GEMINI_DEFAULT_MODEL
if not GEMINI_DEFAULT_MODEL:
    print("WARNING: GEMINI_DEFAULT_MODEL is unset. Configure a deployment-validated model before generating notes.")

SESSION_SECRET = os.getenv("SESSION_SECRET")
JWT_SIGNING_SECRET = os.getenv("JWT_SIGNING_SECRET")
ALLOWED_ORIGINS = set(
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:4321").split(',')
    if origin.strip()
)

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. The application will not be able to connect to the Gemini API.")

if not SESSION_SECRET:
    raise RuntimeError("SESSION_SECRET must be set before starting the AI Scribe service.")

if not JWT_SIGNING_SECRET:
    JWT_SIGNING_SECRET = SESSION_SECRET
    print(
        "WARNING: JWT_SIGNING_SECRET is not set. Falling back to SESSION_SECRET for JWT signing. "
        "This is not recommended; set JWT_SIGNING_SECRET to a different long random string."
    )
