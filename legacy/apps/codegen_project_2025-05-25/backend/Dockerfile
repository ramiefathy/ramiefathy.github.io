FROM python:3.10-slim-buster

ENV PYTHONUNBUFFERED 1
ENV POETRY_HOME="/opt/poetry"
ENV PATH="$POETRY_HOME/bin:$PATH"

# Install system dependencies required for Poetry, Python packages, and PDF/OCR processing
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        build-essential \
        # For PDF processing and OCR capabilities
        tesseract-ocr \
        tesseract-ocr-eng \
        poppler-utils \
        ghostscript \
        libjpeg-dev \
        zlib1g-dev \
        libfreetype6-dev \
        liblcms2-dev \
        libwebp-dev \
        tk-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python -

# Set the working directory inside the container
WORKDIR /app

# Copy poetry configuration files for dependency installation
COPY pyproject.toml poetry.lock /app/

# Install Python dependencies using poetry
# --no-root prevents installing the project itself as a package
# --no-dev skips development dependencies for a leaner production image
RUN poetry install --no-root --no-dev

# Copy the rest of the backend application code
COPY . /app

# Expose the port the Flask application will listen on
EXPOSE 5000

# Default command to run the Flask application using Gunicorn
# This command assumes:
# 1. Your Flask application instance is named 'app'.
# 2. Your main Flask application file is named 'app.py' and is directly under the /app directory.
# This CMD can be overridden when running the container (e.g., in docker-compose.yml)
# to start the Celery worker instead, if needed.
CMD ["poetry", "run", "gunicorn", "--bind", "0.0.0.0:5000", "app:app"]