from flask import Blueprint, request
from src.db import get_db
from src.models import level_for_xp, BADGE_PERFECT, BADGE_QUICK, BADGE_MODULE_MASTER

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.get('/modules/<module_id>/questions')
def get_questions(module_id):
    from bson import ObjectId
    db = get_db()
    q = list(db.questions.find({'moduleId': ObjectId(module_id)}, {'question': 1, 'options': 1}))
    for i in q:
        i['_id'] = str(i['_id'])
    return {'questions': q}


@quiz_bp.post('/modules/<module_id>/submit')
def submit_quiz(module_id):
    from bson import ObjectId
    db = get_db()
    payload = request.get_json(force=True)
    answers = payload.get('answers', [])  # list of {questionId, selected}
    student_id = payload.get('studentId')
    time_taken = int(payload.get('timeTaken', 0))

    # Fetch correct answers
    question_map = {}
    for q in db.questions.find({'moduleId': ObjectId(module_id)}):
        question_map[str(q['_id'])] = q

    score = 0
    total = len(question_map)
    for a in answers:
        qid = a.get('questionId')
        selected = int(a.get('selected', -1))
        q = question_map.get(qid)
        if q and selected == q['correctAnswer']:
            score += 1

    xp_earned = score * 5

    # Update attempt
    attempt = {
        'studentId': ObjectId(student_id),
        'moduleId': ObjectId(module_id),
        'score': score,
        'total': total,
        'xpEarned': xp_earned,
        'timeTaken': time_taken,
        'attemptedAt': __import__('datetime').datetime.utcnow()
    }
    db.quizAttempts.insert_one(attempt)

    # Update user XP and badges
    user = db.users.find_one({'_id': ObjectId(student_id)})
    new_xp = int(user.get('xp', 0)) + xp_earned
    badges = set(user.get('badges', []))
    if total > 0 and score == total:
        badges.add(BADGE_PERFECT)
    if total > 0 and time_taken > 0 and (time_taken / total) <= 10:
        badges.add(BADGE_QUICK)

    # Module Master: all module attempts >= 80%
    attempts = list(db.quizAttempts.find({'studentId': ObjectId(student_id)}))
    by_module = {}
    for at in attempts:
        mid = str(at['moduleId'])
        ratio = (at['score'] / max(at['total'], 1)) if at['total'] else 0
        by_module[mid] = max(by_module.get(mid, 0), ratio)
    if all(r >= 0.8 for r in by_module.values()) and len(by_module) >= 1:
        badges.add(BADGE_MODULE_MASTER)

    # Track completed modules (>=70% pass rate)
    completed_modules = user.get('completedModules', [])
    # Ensure all existing items are strings
    completed_modules = [str(m) for m in completed_modules]
    
    module_id_str = str(module_id)
    if score / max(total, 1) >= 0.7 and module_id_str not in completed_modules:
        completed_modules.append(module_id_str)

    db.users.update_one({'_id': ObjectId(student_id)}, {
        '$set': {
            'xp': new_xp,
            'level': level_for_xp(new_xp),
            'badges': list(badges),
            'completedModules': completed_modules
        }
    })

    return {
        'score': score,
        'total': total,
        'xpEarned': xp_earned,
        'newLevel': level_for_xp(new_xp),
        'previousLevel': user.get('level', 1),
        'badgesEarned': list(badges - set(user.get('badges', [])))
    }
