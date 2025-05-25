import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """
    Centralized configuration management for the backend application.
    Loads environment variables and defines application-wide settings.
    """

    # --- Application General Settings ---
    APP_NAME = os.getenv("APP_NAME", "DermRefGen")
    SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_that_should_be_changed_in_prod")
    DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5000))

    # --- API Keys ---
    # User-provided API key for external LLM services (e.g., Gemini Pro)
    # This key will be handled securely and passed to relevant agents.
    # It's primarily managed at runtime by the SecurityAgent/CoordinatorAgent,
    # but a default placeholder can be here if testing with a global key.
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Ensure this is NOT hardcoded in production!

    # --- File Upload Settings ---
    # Base directory for the backend application
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    # Folder to temporarily store uploaded PDF documents
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    # Ensure the upload folder exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Allowed extensions for uploaded files
    ALLOWED_EXTENSIONS = {'pdf'}

    # Maximum content length for file uploads (e.g., 16 MB)
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)) # 16 Megabytes

    # --- Database Settings ---
    # Database URL (e.g., PostgreSQL, SQLite)
    # Example for SQLite: sqlite:///site.db
    # Example for PostgreSQL: postgresql://user:password@host:port/database_name
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///dermrefgen.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False # Recommended for SQLAlchemy with Flask

    # --- Celery (Asynchronous Task Queue) Settings ---
    # Celery broker URL (e.g., Redis, RabbitMQ)
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    # Celery result backend URL (where results are stored)
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # --- Data Storage Settings (for processed data/extracted entries) ---
    # Folder to store processed data and standardized entries temporarily or persistently
    PROCESSED_DATA_FOLDER = os.path.join(BASE_DIR, 'processed_data')
    os.makedirs(PROCESSED_DATA_FOLDER, exist_ok=True)

    # --- Logging Settings ---
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    LOG_FILE_PATH = os.path.join(BASE_DIR, 'logs', 'app.log')
    os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

    # --- Other Service Endpoints / External Integrations ---
    # If the system uses an external OCR service beyond local Tesseract, its endpoint would go here
    # OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", None)

    # --- Utility Methods ---
    def get_upload_folder(self):
        return self.UPLOAD_FOLDER

    def get_processed_data_folder(self):
        return self.PROCESSED_DATA_FOLDER

    def get_allowed_extensions(self):
        return self.ALLOWED_EXTENSIONS

    def __repr__(self):
        return (f"<Config DEBUG={self.DEBUG} UPLOAD_FOLDER={self.UPLOAD_FOLDER} "
                f"DATABASE_URL={self.DATABASE_URL.split('@')[-1] if '@' in self.DATABASE_URL else self.DATABASE_URL}>")

# You can create a singleton instance of the config
# For example, in your Flask app factory:
# app.config.from_object(Config)