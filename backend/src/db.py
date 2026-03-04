import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import CollectionInvalid
from dotenv import load_dotenv

load_dotenv()

_client = None
_db = None


def init_db():
    global _client, _db
    if _client is None:
        uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        _client = MongoClient(uri)
        _db = _client.get_database(os.getenv('MONGODB_DB', 'compiler_gamified'))
        _ensure_indexes(_db)
    return _db


def get_db():
    if _db is None:
        return init_db()
    return _db


def _ensure_indexes(db):
    """Create all collection indexes (idempotent — safe to run on startup)."""

    # ── users ─────────────────────────────────────────────────────────────────
    db.users.create_index([('email', ASCENDING)], unique=True)
    db.users.create_index([('role', ASCENDING)])
    db.users.create_index([('instructorId', ASCENDING)])

    # ── instructor_assignments ─────────────────────────────────────────────────
    db.instructor_assignments.create_index(
        [('instructorId', ASCENDING), ('studentId', ASCENDING)],
        unique=True
    )
    db.instructor_assignments.create_index([('instructorId', ASCENDING)])
    db.instructor_assignments.create_index([('studentId', ASCENDING)])

    # ── quizAttempts ──────────────────────────────────────────────────────────
    db.quizAttempts.create_index([('studentId', ASCENDING)])
    db.quizAttempts.create_index([('moduleId', ASCENDING)])
    db.quizAttempts.create_index([('instructorId', ASCENDING)])
    db.quizAttempts.create_index([('studentId', ASCENDING), ('moduleId', ASCENDING)])

    # ── userProgress ──────────────────────────────────────────────────────────
    db.userProgress.create_index([('studentId', ASCENDING)], unique=True)
    db.userProgress.create_index([('instructorId', ASCENDING)])
    db.userProgress.create_index([('xp', DESCENDING)])
    db.userProgress.create_index([('level', DESCENDING)])

    # ── contestLeaderboard ────────────────────────────────────────────────────
    db.contestLeaderboard.create_index(
        [('contestId', ASCENDING), ('studentId', ASCENDING)],
        unique=True
    )
    db.contestLeaderboard.create_index([('contestId', ASCENDING)])
    db.contestLeaderboard.create_index([
        ('contestId', ASCENDING),
        ('score', DESCENDING),
        ('timeTaken', ASCENDING)
    ])

    # ── globalLeaderboard ─────────────────────────────────────────────────────
    db.globalLeaderboard.create_index([('studentId', ASCENDING)], unique=True)
    db.globalLeaderboard.create_index([('xp', DESCENDING), ('level', DESCENDING)])
    db.globalLeaderboard.create_index([('rank', ASCENDING)])

    # ── contests ──────────────────────────────────────────────────────────────
    db.contests.create_index([('createdBy', ASCENDING)])
    db.contests.create_index([('startTime', ASCENDING)])

    # ── modules ───────────────────────────────────────────────────────────────
    db.modules.create_index([('courseId', ASCENDING), ('moduleNo', ASCENDING)])
