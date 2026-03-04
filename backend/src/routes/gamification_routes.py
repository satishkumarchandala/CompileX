"""
Gamification Routes — /api/
Student-facing profile and progress endpoints.
"""
from flask import Blueprint, request
from bson import ObjectId

from src.db import get_db
from src.models import level_for_xp, xp_for_next_level

gamification_bp = Blueprint('gamification', __name__)


@gamification_bp.get('/student/profile')
def student_profile():
    db         = get_db()
    student_id = request.args.get('studentId')
    if not student_id:
        return {'error': 'studentId is required'}, 400

    user = db.users.find_one({'_id': ObjectId(student_id)}, {'passwordHash': 0})
    if not user:
        return {'error': 'User not found'}, 404

    user['_id']              = str(user['_id'])
    user['instructorId']     = str(user['instructorId']) if user.get('instructorId') else None
    user['completedModules'] = [str(m) for m in user.get('completedModules', [])]
    user['xpToNextLevel']    = xp_for_next_level(user.get('xp', 0))
    return user


@gamification_bp.get('/student/progress')
def student_progress():
    db         = get_db()
    student_id = request.args.get('studentId')
    if not student_id:
        return {'error': 'studentId is required'}, 400

    student_oid = ObjectId(student_id)

    # Return the pre-computed snapshot for O(1) lookup
    snapshot = db.userProgress.find_one({'studentId': student_oid})
    if snapshot:
        return {
            'totalXp':               snapshot.get('xp', 0),
            'level':                 snapshot.get('level', 1),
            'xpToNextLevel':         xp_for_next_level(snapshot.get('xp', 0)),
            'badges':                snapshot.get('badges', []),
            'completedModulesCount': snapshot.get('completedModulesCount', 0),
            'totalAttempts':         snapshot.get('totalAttempts', 0),
            'lastActiveAt':          snapshot.get('lastActiveAt', '').isoformat() + 'Z'
                                     if snapshot.get('lastActiveAt') else None
        }

    # Fallback: compute from raw attempts (no snapshot yet)
    attempts  = list(db.quizAttempts.find({'studentId': student_oid}))
    total_xp  = sum(int(a.get('xpEarned', 0)) for a in attempts)
    progress  = [
        {
            'moduleId':  str(a['moduleId']),
            'score':     a['score'],
            'total':     a['total'],
            'xpEarned':  a['xpEarned'],
            'timeTaken': a['timeTaken'],
            'attemptedAt': a['attemptedAt'].isoformat() + 'Z'
        }
        for a in attempts
    ]
    return {
        'totalXp':       total_xp,
        'level':         level_for_xp(total_xp),
        'xpToNextLevel': xp_for_next_level(total_xp),
        'attempts':      progress
    }
