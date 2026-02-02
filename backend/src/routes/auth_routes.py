from flask import Blueprint, request, current_app
from src.db import get_db
from src.auth import hash_password, verify_password, create_token

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/register')
def register():
    data = request.get_json(force=True)
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = (data.get('role') or 'student').lower()

    if not name or not email or not password:
        return {'error': 'Missing fields'}, 400

    if role == 'admin' and not current_app.config.get('ALLOW_ADMIN_REG'):
        return {'error': 'Admin registration disabled'}, 403

    db = get_db()
    if db.users.find_one({'email': email}):
        return {'error': 'Email already registered'}, 400

    pwd_hash = hash_password(password)
    user = {
        'name': name,
        'email': email,
        'passwordHash': pwd_hash,
        'role': role,
        'xp': 0,
        'level': 1,
        'badges': [],
        'createdAt': __import__('datetime').datetime.utcnow()
    }
    db.users.insert_one(user)

    token = create_token(current_app, {
        'uid': str(user['_id']), 
        'role': role,
        'name': name,
        'email': email
    })
    return {'token': token, 'role': role}


@auth_bp.post('/login')
def login():
    data = request.get_json(force=True)
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return {'error': 'Missing fields'}, 400

    db = get_db()
    user = db.users.find_one({'email': email})
    if not user or not verify_password(password, user['passwordHash']):
        return {'error': 'Invalid credentials'}, 401

    token = create_token(current_app, {
        'uid': str(user['_id']), 
        'role': user['role'],
        'name': user['name'],
        'email': user['email']
    })
    return {'token': token, 'role': user['role']}
