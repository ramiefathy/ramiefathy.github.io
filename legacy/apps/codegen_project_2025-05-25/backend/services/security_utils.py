import os
import logging
from cryptography.fernet import Fernet, InvalidToken
from typing import Optional

# Configure logging for this module
logger = logging.getLogger(__name__)
# Basic configuration for the logger. In a full application, this would typically
# be configured globally in the main application entry point.
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


class SecurityUtils:
    """
    Provides utility functions for secure handling of sensitive data, specifically the user-provided API key.
    This includes methods for secure storage (in-memory encryption/decryption) for the current application session.
    Ensures API key security as part of the SecurityAgent's responsibilities.
    """

    # Static variables to hold the ephemeral encryption key and the encrypted API key
    _encryption_key: Optional[bytes] = None
    _fernet_cipher: Optional[Fernet] = None
    _encrypted_api_key: Optional[bytes] = None

    @staticmethod
    def _initialize_encryption():
        """
        Initializes the Fernet encryption suite. Generates a new ephemeral key if one doesn't exist.
        This key is created at runtime and exists only in memory for the application's current session.
        In a high-security production environment, this key would be managed via a dedicated
        Key Management System (KMS) or derived from secure environment variables.
        """
        if SecurityUtils._encryption_key is None:
            # Generate a new Fernet key. This key is unique to this process instance.
            SecurityUtils._encryption_key = Fernet.generate_key()
            SecurityUtils._fernet_cipher = Fernet(SecurityUtils._encryption_key)
            logger.info("Fernet encryption key initialized for the session.")

    @staticmethod
    def store_api_key_securely(api_key: str):
        """
        Encrypts the provided API key and stores it securely in memory.
        The API key is encrypted using a session-specific ephemeral key.
        Raises ValueError if the API key is empty.
        """
        if not api_key:
            logger.error("Attempted to store an empty API key.")
            raise ValueError("API key cannot be empty.")

        SecurityUtils._initialize_encryption()
        
        # API key must be bytes for encryption
        api_key_bytes = api_key.encode('utf-8')
        
        try:
            SecurityUtils._encrypted_api_key = SecurityUtils._fernet_cipher.encrypt(api_key_bytes)
            logger.info("API key encrypted and stored securely in memory.")
        except Exception:
            # Use logger.exception to log the full traceback for debugging
            logger.exception("Failed to encrypt API key.") 
            SecurityUtils._encrypted_api_key = None # Clear state in case of failure
            raise # Re-raise to signal storage failure

    @staticmethod
    def retrieve_api_key_securely() -> Optional[str]:
        """
        Retrieves and decrypts the stored API key from memory.
        Returns the decrypted API key as a string, or None if no API key is stored
        or if decryption fails (e.g., due to tampering or key mismatch).
        """
        if SecurityUtils._fernet_cipher is None or SecurityUtils._encrypted_api_key is None:
            logger.debug("No API key or cipher found in memory to retrieve.")
            return None

        try:
            decrypted_api_key_bytes = SecurityUtils._fernet_cipher.decrypt(SecurityUtils._encrypted_api_key)
            logger.info("API key retrieved and decrypted successfully.")
            return decrypted_api_key_bytes.decode('utf-8')
        except InvalidToken:
            # This indicates potential tampering or incorrect key usage (e.g., encryption key changed)
            logger.warning("Decryption failed for API key (InvalidToken). Data might be tampered or key mismatch. Clearing state.")
            SecurityUtils.clear_api_key() # Clear potentially invalid state
            return None
        except Exception:
            logger.exception("Failed to decrypt API key due to an unexpected error. Clearing state.")
            SecurityUtils.clear_api_key() # Clear potentially invalid state
            return None

    @staticmethod
    def clear_api_key():
        """
        Clears the securely stored encrypted API key from memory.
        Does not clear the ephemeral encryption key itself, allowing for subsequent
        secure storage operations within the same session.
        """
        if SecurityUtils._encrypted_api_key is not None:
            SecurityUtils._encrypted_api_key = None
            logger.info("Encrypted API key cleared from memory.")
        else:
            logger.debug("No API key found to clear from memory.")

    @staticmethod
    def is_api_key_stored() -> bool:
        """
        Checks if an encrypted API key is currently stored in memory.
        """
        return SecurityUtils._encrypted_api_key is not None