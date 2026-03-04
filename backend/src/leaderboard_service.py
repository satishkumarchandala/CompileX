"""
leaderboard_service.py
Centralised helpers for updating and rebuilding leaderboard collections.
Called from quiz_routes (on every quiz submit) and superadmin_routes (manual rebuild).
"""
import datetime
from bson import ObjectId


# ─────────────────────────────────────────────────────────────────────────────
#  Update a single student's snapshot in userProgress + globalLeaderboard
# ─────────────────────────────────────────────────────────────────────────────
def update_student_snapshots(db, student_id: ObjectId):
    """
    Recompute and persist the userProgress + globalLeaderboard snapshot for one student.
    Called after every quiz submission to keep the data fresh.
    """
    user = db.users.find_one({'_id': student_id})
    if not user:
        return

    now = datetime.datetime.utcnow()

    # Build progress snapshot
    progress_doc = {
        'studentId':            student_id,
        'instructorId':         user.get('instructorId'),
        'name':                 user['name'],
        'xp':                   user.get('xp', 0),
        'level':                user.get('level', 1),
        'badges':               user.get('badges', []),
        'completedModulesCount': len(user.get('completedModules', [])),
        'completedModules':     user.get('completedModules', []),
        'totalAttempts':        db.quizAttempts.count_documents({'studentId': student_id}),
        'lastActiveAt':         now,
        'updatedAt':            now
    }

    db.userProgress.update_one(
        {'studentId': student_id},
        {'$set': progress_doc},
        upsert=True
    )

    # Build global leaderboard snapshot (rank will be recomputed separately)
    lb_doc = {
        'studentId':            student_id,
        'studentName':          user['name'],
        'instructorId':         user.get('instructorId'),
        'xp':                   user.get('xp', 0),
        'level':                user.get('level', 1),
        'completedModulesCount': len(user.get('completedModules', [])),
        'updatedAt':            now
    }

    db.globalLeaderboard.update_one(
        {'studentId': student_id},
        {'$set': lb_doc},
        upsert=True
    )

    # Recompute ranks across all students
    _recompute_global_ranks(db)


# ─────────────────────────────────────────────────────────────────────────────
#  Recompute ranks for the global leaderboard
# ─────────────────────────────────────────────────────────────────────────────
def _recompute_global_ranks(db):
    """Sort all entries by (xp DESC, level DESC, completedModulesCount DESC)
    and assign rank 1, 2, 3, ..."""
    entries = list(db.globalLeaderboard.find(
        {},
        {'_id': 1, 'xp': 1, 'level': 1, 'completedModulesCount': 1}
    ))

    entries.sort(key=lambda e: (
        -e.get('xp', 0),
        -e.get('level', 1),
        -e.get('completedModulesCount', 0)
    ))

    for rank, entry in enumerate(entries, start=1):
        db.globalLeaderboard.update_one(
            {'_id': entry['_id']},
            {'$set': {'rank': rank}}
        )


# ─────────────────────────────────────────────────────────────────────────────
#  Full rebuild — used on demand by Super Admin
# ─────────────────────────────────────────────────────────────────────────────
def rebuild_global_leaderboard(db):
    """Rebuild globalLeaderboard from scratch using live users data."""
    students = list(db.users.find({'role': 'student'}))
    for student in students:
        update_student_snapshots(db, student['_id'])


# ─────────────────────────────────────────────────────────────────────────────
#  Contest leaderboard helpers
# ─────────────────────────────────────────────────────────────────────────────
def update_contest_ranks(db, contest_id: ObjectId):
    """Sort and persist ranks within a single contest's leaderboard."""
    entries = list(db.contestLeaderboard.find(
        {'contestId': contest_id, 'isSubmitted': True},
        {'_id': 1, 'score': 1, 'timeTaken': 1}
    ))

    entries.sort(key=lambda e: (
        -e.get('score', 0),
        e.get('timeTaken', 0)   # faster time wins on tie
    ))

    for rank, entry in enumerate(entries, start=1):
        db.contestLeaderboard.update_one(
            {'_id': entry['_id']},
            {'$set': {'rank': rank}}
        )

    return entries  # sorted, with new ranks
