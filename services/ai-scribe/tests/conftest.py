"""Shared offline test environment. No provider calls or patient data are used."""
import os

# config.py fails closed without an explicit, deployment-validated model. Tests only ever
# exercise mocked transports, so a synthetic placeholder name is sufficient here.
os.environ.setdefault("GEMINI_DEFAULT_MODEL", "synthetic-test-model")
os.environ.setdefault("SESSION_SECRET", "test-secret")
os.environ.setdefault("JWT_SIGNING_SECRET", "test-jwt-secret")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:8765")
