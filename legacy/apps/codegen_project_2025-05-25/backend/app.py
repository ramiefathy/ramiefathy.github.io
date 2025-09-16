from flask import Flask, jsonify
from flask_cors import CORS
from celery import Celery

# Import the SQLAlchemy db instance from models.py
# This prevents circular imports and ensures db is initialized once
from models import db

# Initialize Celery globally, without binding it to a specific Flask app yet.
# This allows Celery to be configured with the app's settings later.
celery_app = Celery(__name__)

def create_app():
    """
    Factory function to create and configure the Flask application.
    This pattern is recommended for larger applications to allow for
    multiple app instances (e.g., for testing).
    """
    app = Flask(__name__)

    # Load configuration from config.py
    app.config.from_object('config.Config')

    # Enable Cross-Origin Resource Sharing (CORS) for the Flask app.
    # This is crucial for allowing the frontend (likely running on a different port)
    # to make requests to this backend API.
    CORS(app)

    # Initialize SQLAlchemy with the Flask app instance.
    # This binds the database connection to the application.
    db.init_app(app)

    # Configure Celery using settings from the Flask app's config.
    # This includes broker URL (e.g., Redis) and result backend.
    celery_app.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND'],
        # Optional: You might want to specify task modules explicitly if they are not
        # auto-discovered, e.g., 'tasks'.
        # include=['tasks'] # If your tasks are in 'backend/tasks.py'
    )

    # Make the Flask application context available to Celery tasks.
    # This is essential for tasks that need to interact with the database (db instance),
    # or access any other app-specific configurations/resources.
    class ContextTask(celery_app.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    celery_app.Task = ContextTask

    # Create database tables if they don't already exist.
    # In a production environment, database migrations (e.g., with Flask-Migrate)
    # would be used instead of db.create_all() to manage schema changes.
    with app.app_context():
        db.create_all()

    # Register API Blueprints (routes)
    # Blueprints organize routes and other Flask components into logical groups.
    # Each blueprint typically corresponds to a specific functional area of the API.
    from routes.general_routes import general_bp
    from routes.upload_routes import upload_bp
    from routes.condition_routes import condition_bp
    from routes.download_routes import download_bp

    app.register_blueprint(general_bp)
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(condition_bp, url_prefix='/api/conditions')
    app.register_blueprint(download_bp, url_prefix='/api/download')

    # Define a basic health check endpoint.
    # This is useful for monitoring the application's status.
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "DermRefGen Backend is running!"})

    return app

# Entry point for running the Flask development server.
if __name__ == '__main__':
    # Create the application instance.
    app = create_app()
    # Run the development server.
    # debug=True enables debug mode (reloads on code changes, provides debugger).
    # host='0.0.0.0' makes the server accessible from any IP address (useful in Docker).
    # port=5000 is the standard development port.
    app.run(debug=True, host='0.0.0.0', port=5000)