"""
Quiz Routes — /api/
Handles module question fetching and quiz submission with XP/badge logic.
On each submission the userProgress and globalLeaderboard snapshots are updated.

Quiz unlock enforcement:
  GET /api/modules/<module_id>/questions now checks moduleUnlocks collection.
  Students without an isUnlocked=True record receive 403 { error, reason }.
  Admins and super-admins are exempt from the gate.
"""
import datetime
import logging
from flask import Blueprint, request
from bson import ObjectId

from src.db import get_db
from src.models import (
    level_for_xp,
    BADGE_PERFECT, BADGE_QUICK, BADGE_MODULE_MASTER,
    BADGE_FIRST_STEP, BADGE_SPEED_DEMON
)
from src.leaderboard_service import update_student_snapshots
from src.auth import get_current_user

logger = logging.getLogger(__name__)

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.get('/modules/<module_id>/questions')
def get_questions(module_id):
    """
    Returns quiz questions for a module.
    Requires the (student, module) unlock to be satisfied first.
    Admins and super-admins bypass the lock check.
    """
    db   = get_db()
    user = get_current_user()

    # ── Unlock gate (students only) ───────────────────────────────────────────
    role = user.get('role') if user else None

    if role == 'student':
        try:
            student_oid = ObjectId(user['uid'])
            module_oid  = ObjectId(module_id)
        except Exception:
            return {'error': 'Invalid ID format'}, 400

        unlock_doc = db.moduleUnlocks.find_one({
            'studentId': student_oid,
            'moduleId':  module_oid
        })

        if not unlock_doc or not unlock_doc.get('isUnlocked'):
            video_ok   = unlock_doc.get('videoSatisfied', False)  if unlock_doc else False
            reading_ok = unlock_doc.get('readTimerSatisfied', False) if unlock_doc else False

            if not unlock_doc:
                reason = "You must open the module content before attempting the quiz."
            elif not video_ok:
                reason = "You must watch all module videos to ≥ 95% before the quiz unlocks."
            elif not reading_ok:
                required = unlock_doc.get('readSecondsRequired', 300)
                reason = (
                    f"You must spend at least {required // 60} minute(s) reading the module "
                    f"content before the quiz unlocks."
                )
            else:
                reason = "Quiz is still locked. Complete all requirements to unlock."

            return {'error': 'Quiz locked', 'reason': reason}, 403

    elif not user:
        # Unauthenticated — also blocked
        return {'error': 'Authentication required'}, 401

    # ── Fetch questions (no correct answer exposed) ───────────────────────────
    q = list(db.questions.find(
        {'moduleId': ObjectId(module_id)},
        {'question': 1, 'options': 1}
    ))
    for i in q:
        i['_id'] = str(i['_id'])
    return {'questions': q}



@quiz_bp.post('/modules/<module_id>/submit')
def submit_quiz(module_id):
    db      = get_db()
    payload = request.get_json(force=True)

    answers    = payload.get('answers', [])   # [{questionId, selected}]
    student_id = payload.get('studentId')
    time_taken = int(payload.get('timeTaken', 0))

    if not student_id:
        return {'error': 'studentId is required'}, 400

    student_oid = ObjectId(student_id)
    module_oid  = ObjectId(module_id)

    # ── Grade the quiz ────────────────────────────────────────────────────────
    question_map = {
        str(q['_id']): q
        for q in db.questions.find({'moduleId': module_oid})
    }
    total = len(question_map)
    score = 0
    for a in answers:
        q = question_map.get(a.get('questionId'))
        if q and int(a.get('selected', -1)) == q['correctAnswer']:
            score += 1

    # ── Completion check ──────────────────────────────────────────────────────
    user                   = db.users.find_one({'_id': student_oid})
    if not user:
        return {'error': 'Student not found'}, 404

    module_id_str          = str(module_id)
    completed_modules_list = [str(m) for m in user.get('completedModules', [])]
    was_already_completed  = module_id_str in completed_modules_list
    pass_rate              = score / max(total, 1)
    module_is_now_completed = pass_rate >= 0.7
    is_first_completion    = module_is_now_completed and not was_already_completed

    # ── XP calculation ────────────────────────────────────────────────────────
    xp_earned = 0
    if is_first_completion:
        xp_earned = score * 5          # 5 XP per correct answer, first time only

    old_xp  = int(user.get('xp', 0))
    new_xp  = old_xp + xp_earned
    new_lvl = level_for_xp(new_xp)
    old_lvl = user.get('level', 1)

    # ── Badge logic ───────────────────────────────────────────────────────────
    badges = set(user.get('badges', []))
    if total > 0 and score == total:
        badges.add(BADGE_PERFECT)
    if time_taken > 0 and total > 0 and (time_taken / total) <= 10:
        badges.add(BADGE_QUICK)
    if time_taken > 0 and time_taken <= 60:
        badges.add(BADGE_SPEED_DEMON)

    # Module Master: best ratio on EVERY attempted module >= 80%
    all_attempts = list(db.quizAttempts.find({'studentId': student_oid}))
    by_module    = {}
    for at in all_attempts:
        mid   = str(at['moduleId'])
        ratio = (at['score'] / max(at['total'], 1)) if at['total'] else 0
        by_module[mid] = max(by_module.get(mid, 0), ratio)
    # Include current attempt
    by_module[module_id_str] = max(by_module.get(module_id_str, 0), pass_rate)
    if all(r >= 0.8 for r in by_module.values()) and len(by_module) >= 1:
        badges.add(BADGE_MODULE_MASTER)

    # First Step badge
    if is_first_completion and len(completed_modules_list) == 0:
        badges.add(BADGE_FIRST_STEP)

    # ── Update completedModules list ──────────────────────────────────────────
    updated_completed = completed_modules_list[:]
    if is_first_completion:
        updated_completed.append(module_id_str)

    # ── Persist quiz attempt ──────────────────────────────────────────────────
    attempt = {
        'studentId':         student_oid,
        'instructorId':      user.get('instructorId'),  # denormalized
        'moduleId':          module_oid,
        'score':             score,
        'total':             total,
        'xpEarned':          xp_earned,
        'timeTaken':         time_taken,
        'isFirstCompletion': is_first_completion,
        'attemptedAt':       datetime.datetime.utcnow()
    }
    db.quizAttempts.insert_one(attempt)

    # ── Persist user updates ──────────────────────────────────────────────────
    db.users.update_one(
        {'_id': student_oid},
        {'$set': {
            'xp':               new_xp,
            'level':            new_lvl,
            'badges':           list(badges),
            'completedModules': [ObjectId(m) for m in updated_completed]
        }}
    )

    # ── Refresh leaderboard snapshots ─────────────────────────────────────────
    update_student_snapshots(db, student_oid)

    newly_earned = list(badges - set(user.get('badges', [])))
    return {
        'score':             score,
        'total':             total,
        'xpEarned':          xp_earned,
        'newLevel':          new_lvl,
        'previousLevel':     old_lvl,
        'levelUp':           new_lvl > old_lvl,
        'badgesEarned':      newly_earned,
        'isFirstCompletion': is_first_completion,
        'moduleCompleted':   module_is_now_completed
    }
