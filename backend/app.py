import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from src.db import init_db
from src.routes.auth_routes import auth_bp
from src.routes.course_routes import course_bp
from src.routes.quiz_routes import quiz_bp
from src.routes.gamification_routes import gamification_bp
from src.routes.contest_routes import contest_bp
from src.routes.admin_routes import admin_bp
from src.routes.superadmin_routes import superadmin_bp
from src.routes.module_unlock_routes import module_unlock_bp
from src.services.seed import seed_initial_data


def create_app():
    app = Flask(__name__)
    
    # Configure CORS to allow frontend origins
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",  # Local development
                "https://compile-x-tau.vercel.app",  # Production Vercel
                "https://*.vercel.app"  # All Vercel preview deployments
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    app.config['JWT_SECRET']           = os.getenv('JWT_SECRET', 'devsecret')
    # Allow student self-registration (always True for public sign-up)
    app.config['ALLOW_STUDENT_REG']    = True
    # Set ALLOW_SUPER_ADMIN_REG=true in .env ONLY for the very first bootstrap
    app.config['ALLOW_SUPER_ADMIN_REG'] = os.getenv('ALLOW_SUPER_ADMIN_REG', 'false').lower() == 'true'

    # Initialize DB (also creates indexes)
    init_db()

    # Seed initial course/modules (idempotent)
    seed_initial_data()

    # ── Register Blueprints ───────────────────────────────────────────────────
    app.register_blueprint(auth_bp,           url_prefix='/api/auth')
    app.register_blueprint(course_bp,         url_prefix='/api')
    app.register_blueprint(quiz_bp,           url_prefix='/api')
    app.register_blueprint(module_unlock_bp,  url_prefix='/api')
    app.register_blueprint(gamification_bp,   url_prefix='/api')
    app.register_blueprint(contest_bp,        url_prefix='/api')
    app.register_blueprint(admin_bp,          url_prefix='/api/admin')
    app.register_blueprint(superadmin_bp,     url_prefix='/api/superadmin')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'version': '2.0'}

    return app


# Create app instance for gunicorn
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=True)
