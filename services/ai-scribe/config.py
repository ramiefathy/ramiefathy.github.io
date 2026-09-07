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
def _model_id(value: str) -> str:
    return value.strip().removeprefix("models/")


GEMINI_DEFAULT_MODEL = _model_id(os.getenv("GEMINI_DEFAULT_MODEL", ""))
if not GEMINI_DEFAULT_MODEL:
    raise RuntimeError(
        "GEMINI_DEFAULT_MODEL must be set to a deployment-validated model before starting the AI Scribe service."
    )
GEMINI_VISION_MODEL = _model_id(os.getenv("GEMINI_VISION_MODEL", "")) or GEMINI_DEFAULT_MODEL
GEMINI_SUGGESTION_MODEL = _model_id(os.getenv("GEMINI_SUGGESTION_MODEL", "")) or GEMINI_DEFAULT_MODEL

# Client-supplied `modelName` overrides are honored only when listed here; anything else falls
# back to the server-configured model. The default allowlist is the default model alone.
GEMINI_ALLOWED_MODELS = frozenset(
    {GEMINI_DEFAULT_MODEL}
    | {_model_id(name) for name in os.getenv("GEMINI_ALLOWED_MODELS", "").split(",") if _model_id(name)}
)

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
