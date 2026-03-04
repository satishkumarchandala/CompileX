"""
Auth Routes — /api/auth/
Handles registration (students only via self-service) and login for all roles.
Admin accounts are created exclusively by super_admin via /api/superadmin/create-admin.
"""
import datetime
from flask import Blueprint, request, current_app
from src.db import get_db
from src.auth import hash_password, verify_password, create_token
from src.models import ROLE_STUDENT, ROLE_ADMIN, ROLE_SUPER_ADMIN, VALID_ROLES

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/register')
def register():
    """
    Public registration — only 'student' role is permitted.
    Super Admin must use /api/superadmin/create-admin to create admin accounts.
    First super_admin account can be seeded via ALLOW_SUPER_ADMIN_REG env var.
    """
    data     = request.get_json(force=True)
    name     = (data.get('name') or '').strip()
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role     = (data.get('role') or ROLE_STUDENT).lower()

    if not name or not email or not password:
        return {'error': 'name, email and password are required'}, 400

    # Only allow student self-registration; admins created by super_admin
    if role == ROLE_ADMIN:
        return {'error': 'Admin accounts must be created by a Super Admin'}, 403

    if role == ROLE_SUPER_ADMIN:
        if not current_app.config.get('ALLOW_SUPER_ADMIN_REG'):
            return {'error': 'Super Admin registration is disabled'}, 403

    if role not in VALID_ROLES:
        return {'error': f'Invalid role. Must be one of: {sorted(VALID_ROLES)}'}, 400

    db = get_db()
    if db.users.find_one({'email': email}):
        return {'error': 'Email already registered'}, 400

    now = datetime.datetime.utcnow()
    user = {
        'name':             name,
        'email':            email,
        'passwordHash':     hash_password(password),
        'role':             role,
        'instructorId':     None,
        'xp':               0,
        'level':            1,
        'badges':           [],
        'completedModules': [],
        'createdAt':        now,
        'createdBy':        None
    }
    result = db.users.insert_one(user)
    uid    = str(result.inserted_id)

    token = create_token(current_app, {
        'uid':   uid,
        'role':  role,
        'name':  name,
        'email': email
    })
    return {'token': token, 'role': role, 'uid': uid}, 201


@auth_bp.post('/login')
def login():
    data     = request.get_json(force=True)
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return {'error': 'email and password are required'}, 400

    db   = get_db()
    user = db.users.find_one({'email': email})
    if not user or not verify_password(password, user['passwordHash']):
        return {'error': 'Invalid credentials'}, 401

    token = create_token(current_app, {
        'uid':   str(user['_id']),
        'role':  user['role'],
        'name':  user['name'],
        'email': user['email']
    })
    return {
        'token': token,
        'role':  user['role'],
        'uid':   str(user['_id']),
        'name':  user['name']
    }
