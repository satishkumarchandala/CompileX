from flask import Blueprint, request
from src.db import get_db
from src.models import level_for_xp

gamification_bp = Blueprint('gamification', __name__)


@gamification_bp.get('/student/profile')
def student_profile():
    from bson import ObjectId
    db = get_db()
    student_id = request.args.get('studentId')
    user = db.users.find_one({'_id': ObjectId(student_id)}, {'passwordHash': 0})
    if not user:
        return {'error': 'User not found'}, 404
    user['_id'] = str(user['_id'])
    return user


@gamification_bp.get('/student/progress')
def student_progress():
    from bson import ObjectId
    db = get_db()
    student_id = request.args.get('studentId')
    attempts = list(db.quizAttempts.find({'studentId': ObjectId(student_id)}))
    total_xp = 0
    progress = []
    for a in attempts:
        total_xp += int(a.get('xpEarned', 0))
        progress.append({
            'moduleId': str(a['moduleId']),
            'score': a['score'],
            'total': a['total'],
            'xpEarned': a['xpEarned'],
            'timeTaken': a['timeTaken'],
            'attemptedAt': a['attemptedAt'].isoformat() + 'Z'
        })
    return {
        'totalXp': total_xp,
        'level': level_for_xp(total_xp),
        'attempts': progress
    }
