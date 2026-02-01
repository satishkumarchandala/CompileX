import os
import datetime
import jwt
import bcrypt

JWT_ALG = 'HS256'


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # Encode password to bytes (bcrypt requires bytes)
    password_bytes = password.encode('utf-8')
    # bcrypt has a 72-byte limit, hash will handle this automatically
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string for storage
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a bcrypt hash."""
    # Encode password and hash to bytes
    password_bytes = password.encode('utf-8')
    hash_bytes = password_hash.encode('utf-8')
    # bcrypt.checkpw handles the verification
    return bcrypt.checkpw(password_bytes, hash_bytes)


def create_token(app, payload: dict, expires_minutes: int = 60) -> str:
    secret = app.config.get('JWT_SECRET')
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_minutes)
    to_encode = {**payload, 'exp': exp}
    return jwt.encode(to_encode, secret, algorithm=JWT_ALG)


def decode_token(app, token: str) -> dict:
    secret = app.config.get('JWT_SECRET')
    return jwt.decode(token, secret, algorithms=[JWT_ALG])
