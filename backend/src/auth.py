import os
import datetime
import jwt
import bcrypt
from functools import wraps
from flask import request, current_app

JWT_ALG = 'HS256'


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a bcrypt hash."""
    password_bytes = password.encode('utf-8')
    hash_bytes = password_hash.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)


def create_token(app, payload: dict, expires_minutes: int = 43200) -> str:
    secret = app.config.get('JWT_SECRET')
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_minutes)
    to_encode = {**payload, 'exp': exp}
    return jwt.encode(to_encode, secret, algorithm=JWT_ALG)


def decode_token(app, token: str) -> dict:
    secret = app.config.get('JWT_SECRET')
    return jwt.decode(token, secret, algorithms=[JWT_ALG])


def get_current_user():
    """Extract and decode the JWT from the Authorization header.
    Returns the decoded payload dict or None if missing/invalid."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    try:
        payload = decode_token(current_app, token)
        return payload
    except Exception:
        return None


def require_auth(*allowed_roles):
    """Decorator factory. Usage:
        @require_auth('super_admin', 'admin')
        def my_route(): ...
    If called with no args (@require_auth) any authenticated user is allowed.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return {'error': 'Authentication required'}, 401
            if allowed_roles and user.get('role') not in allowed_roles:
                return {'error': 'Insufficient permissions'}, 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


# Convenience decorators
def super_admin_required(f):
    return require_auth('super_admin')(f)


def admin_required(f):
    return require_auth('super_admin', 'admin')(f)


def student_required(f):
    return require_auth('super_admin', 'admin', 'student')(f)


# Role constants
ROLE_SUPER_ADMIN = 'super_admin'
ROLE_ADMIN = 'admin'
ROLE_STUDENT = 'student'

VALID_ROLES = {ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STUDENT}
