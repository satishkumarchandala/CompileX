"""
Super Admin Routes — /api/superadmin/
Only accessible by users with role == 'super_admin'.
Responsibilities:
  - Create admin (instructor) accounts
  - List all admins
  - Assign / unassign students to instructors
  - System-wide statistics
"""
import datetime
from flask import Blueprint, request
from bson import ObjectId

from src.db import get_db
from src.auth import (
    hash_password, create_token, get_current_user,
    super_admin_required, ROLE_ADMIN, ROLE_STUDENT
)
from src.leaderboard_service import rebuild_global_leaderboard

superadmin_bp = Blueprint('superadmin', __name__)


# ─────────────────────────────────────────────────────────────────────────────
#  Helper — serialize a user document safely
# ─────────────────────────────────────────────────────────────────────────────
def _serialize_user(u: dict) -> dict:
    u = dict(u)
    u['_id'] = str(u['_id'])
    if u.get('instructorId'):
        u['instructorId'] = str(u['instructorId'])
    if u.get('createdBy'):
        u['createdBy'] = str(u['createdBy'])
        
    if isinstance(u.get('completedModules'), list):
        u['completedModules'] = [str(mid) for mid in u['completedModules']]
    
    if u.get('createdAt') and hasattr(u['createdAt'], 'isoformat'):
        u['createdAt'] = u['createdAt'].isoformat() + 'Z'
        
    u.pop('passwordHash', None)
    return u


# ─────────────────────────────────────────────────────────────────────────────
#  Create an Admin (Course Instructor)
# ─────────────────────────────────────────────────────────────────────────────
@superadmin_bp.post('/create-admin')
@super_admin_required
def create_admin():
    """Super Admin creates a new admin/instructor account."""
    caller = get_current_user()
    db = get_db()
    data = request.get_json(force=True)

    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return {'error': 'name, email and password are required'}, 400

    if db.users.find_one({'email': email}):
        return {'error': 'Email already registered'}, 400

    pwd_hash = hash_password(password)
    now      = datetime.datetime.utcnow()

    admin_doc = {
        'name':         name,
        'email':        email,
        'passwordHash': pwd_hash,
        'role':         ROLE_ADMIN,
        'instructorId': None,
        'xp':           0,
        'level':        1,
        'badges':       [],
        'completedModules': [],
        'createdAt':    now,
        'createdBy':    ObjectId(caller['uid'])
    }
    result = db.users.insert_one(admin_doc)

    return {
        'status': 'created',
        'adminId': str(result.inserted_id),
        'name': name,
        'email': email
    }, 201


# ─────────────────────────────────────────────────────────────────────────────
#  List all Admins
# ─────────────────────────────────────────────────────────────────────────────
@superadmin_bp.get('/admins')
@super_admin_required
def list_admins():
    db = get_db()
    admins = list(db.users.find({'role': ROLE_ADMIN}, {'passwordHash': 0}))

    result = []
    for a in admins:
        a_dict = _serialize_user(a)
        # Count how many students are assigned to this admin
        a_dict['assignedStudentCount'] = db.instructor_assignments.count_documents(
            {'instructorId': a['_id']}
        )
        result.append(a_dict)

    return {'admins': result}


# ─────────────────────────────────────────────────────────────────────────────
#  List all Students
# ─────────────────────────────────────────────────────────────────────────────
@superadmin_bp.get('/students')
@super_admin_required
def list_all_students():
    db = get_db()
    students = list(db.users.find({'role': ROLE_STUDENT}, {'passwordHash': 0}))
    return {'students': [_serialize_user(s) for s in students]}


# ─────────────────────────────────────────────────────────────────────────────
#  Assign student(s) to an instructor
# ─────────────────────────────────────────────────────────────────────────────
@superadmin_bp.post('/assign-student')
@super_admin_required
def assign_student():
    """
    Body: { "instructorId": "<id>", "studentIds": ["<id>", ...] }
    Idempotent: already-existing assignments are silently ignored.
    """
    caller = get_current_user()
    db = get_db()
    data = request.get_json(force=True)

    instructor_id_str = data.get('instructorId')
    student_ids_str   = data.get('studentIds', [])

    if not instructor_id_str or not student_ids_str:
        return {'error': 'instructorId and studentIds are required'}, 400

    try:
        instructor_oid = ObjectId(instructor_id_str)
        student_oids   = [ObjectId(sid) for sid in student_ids_str]
    except Exception:
        return {'error': 'Invalid ObjectId format'}, 400

    # Validate instructor exists and has admin role
    instructor = db.users.find_one({'_id': instructor_oid, 'role': ROLE_ADMIN})
    if not instructor:
        return {'error': 'Instructor not found or not an admin'}, 404

    # Validate all students exist
    found_students = list(db.users.find(
        {'_id': {'$in': student_oids}, 'role': ROLE_STUDENT},
        {'_id': 1}
    ))
    found_ids = {s['_id'] for s in found_students}
    missing   = [str(oid) for oid in student_oids if oid not in found_ids]
    if missing:
        return {'error': f'Students not found or not students: {missing}'}, 404

    now = datetime.datetime.utcnow()
    assigned_count  = 0
    skipped_count   = 0

    for student_oid in student_oids:
        try:
            db.instructor_assignments.insert_one({
                'instructorId': instructor_oid,
                'studentId':    student_oid,
                'assignedAt':   now,
                'assignedBy':   ObjectId(caller['uid'])
            })
            # Also update the student's instructorId field
            db.users.update_one(
                {'_id': student_oid},
                {'$set': {'instructorId': instructor_oid}}
            )
            # Update userProgress snapshot
            db.userProgress.update_one(
                {'studentId': student_oid},
                {'$set': {'instructorId': instructor_oid}},
                upsert=False
            )
            # Update globalLeaderboard snapshot
            db.globalLeaderboard.update_one(
                {'studentId': student_oid},
                {'$set': {'instructorId': instructor_oid}},
                upsert=False
            )
            assigned_count += 1
        except Exception:
            # Duplicate key error — already assigned
            skipped_count += 1

    return {
        'status': 'done',
        'assigned': assigned_count,
        'alreadyAssigned': skipped_count
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Unassign a student from an instructor
# ─────────────────────────────────────────────────────────────────────────────
@superadmin_bp.delete('/unassign-student')
@super_admin_required
def unassign_student():
    """Body: { "instructorId": "<id>", "studentId": "<id>" }"""
    db = get_db()
    data = request.get_json(force=True)

    try:
        instructor_oid = ObjectId(data.get('instructorId'))
        student_oid    = ObjectId(data.get('studentId'))
    except Exception:
        return {'error': 'Invalid ObjectId format'}, 400

    result = db.instructor_assignments.delete_one({
        'instructorId': instructor_oid,
        'studentId':    student_oid
    })

    if result.deleted_count == 0:
        return {'error': 'Assignment not found'}, 404

    # Clear instructorId in student record if it matches this instructor
    db.users.update_one(
        {'_id': student_oid, 'instructorId': instructor_oid},
        {'$set': {'instructorId': None}}
    )
    db.userProgress.update_one(
        {'studentId': student_oid, 'instructorId': instructor_oid},
        {'$set': {'instructorId': None}}
    )
    db.globalLeaderboard.update_one(
        {'studentId': student_oid, 'instructorId': instructor_oid},
        {'$set': {'instructorId': None}}
    )

    return {'status': 'unassigned'}


# ─────────────────────────────────────────────────────────────────────────────
#  System-wide Statistics
# ─────────────────────────────────────────────────────────────────────────────
@superadmin_bp.get('/stats')
@super_admin_required
def system_stats():
    db = get_db()
    from src.models import ROLE_SUPER_ADMIN

    return {
        'totalUsers':        db.users.count_documents({}),
        'superAdminCount':   db.users.count_documents({'role': ROLE_SUPER_ADMIN}),
        'adminCount':        db.users.count_documents({'role': ROLE_ADMIN}),
        'studentCount':      db.users.count_documents({'role': ROLE_STUDENT}),
        'totalModules':      db.modules.count_documents({}),
        'totalCourses':      db.courses.count_documents({}),
        'totalContests':     db.contests.count_documents({}),
        'totalQuizAttempts': db.quizAttempts.count_documents({}),
        'totalAssignments':  db.instructor_assignments.count_documents({})
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Rebuild global leaderboard (admin utility)
# ─────────────────────────────────────────────────────────────────────────────
@superadmin_bp.post('/rebuild-leaderboard')
@super_admin_required
def trigger_rebuild_leaderboard():
    db = get_db()
    rebuild_global_leaderboard(db)
    return {'status': 'rebuilt'}
