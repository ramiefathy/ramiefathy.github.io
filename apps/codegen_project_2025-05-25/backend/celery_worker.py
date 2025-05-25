import os
from celery import Celery

# Celery Configuration
# Environment variables are preferred for sensitive information and deployment flexibility.
# Default to localhost Redis if not set, suitable for local development.
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Initialize Celery app
# The first argument 'dermrefgen_celery_worker' is the name of the Celery app.
# The 'backend' is the Python package where this worker file resides.
# We assume 'tasks.py' will also be within this 'backend' package.
app = Celery(
    'dermrefgen_celery_worker',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    # include specifies modules where Celery should look for tasks.
    # This assumes 'tasks.py' is located within the 'backend' package.
    include=['backend.tasks'] 
)

# Configure Celery
app.conf.update(
    task_track_started=True,    # Track task status as 'STARTED' during execution
    task_serializer='json',     # Serialize tasks using JSON
    accept_content=['json'],    # Only accept JSON serialized content
    result_serializer='json',   # Serialize results using JSON
    timezone='UTC',             # Use UTC timezone for tasks
    enable_utc=True,            # Enable UTC support
    result_expires=3600,        # Task results will expire after 1 hour (3600 seconds)
    # Further configurations can be added here, e.g., task queues, concurrency limits.
    # worker_concurrency=4, # Number of concurrent worker processes/threads
    # worker_max_tasks_per_child=100, # Restart worker process after 100 tasks to prevent memory leaks
)

# This file primarily defines the 'app' instance.
# To start the Celery worker, you would typically execute a command from your
# project's root directory (where 'backend' is a package), like:
# celery -A backend.celery_worker worker -l info