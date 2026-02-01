import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from src.db import init_db
from src.routes.auth_routes import auth_bp
from src.routes.course_routes import course_bp
from src.routes.quiz_routes import quiz_bp
from src.routes.gamification_routes import gamification_bp
from src.routes.contest_routes import contest_bp
from src.routes.admin_routes import admin_bp
from src.services.seed import seed_initial_data


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'devsecret')
    app.config['ALLOW_ADMIN_REG'] = os.getenv('ALLOW_ADMIN_REG', 'true').lower() == 'true'

    # Initialize DB
    init_db()

    # Seed initial course/modules (idempotent)
    seed_initial_data()

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(course_bp, url_prefix='/api')
    app.register_blueprint(quiz_bp, url_prefix='/api')
    app.register_blueprint(gamification_bp, url_prefix='/api')
    app.register_blueprint(contest_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    return app


# Create app instance for gunicorn
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=True)
