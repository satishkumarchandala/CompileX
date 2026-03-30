"""
Module Unlock Routes — /api/
Implements per-(studentId, moduleId) unlock gating for quizzes.

Unlock conditions (both must pass):
  - requiresVideoCompletion: True  → student must watch video(s) to ≥ 95%
  - requiresReadingTime: True      → student must spend ≥ minReadSeconds (default 300) on content

Once unlocked it stays unlocked forever (isUnlocked = True).

New endpoints:
  POST /api/modules/<module_id>/open            — record first open; return unlock status
  POST /api/modules/<module_id>/video/progress  — update video watch progress
  GET  /api/modules/<module_id>/unlock-status   — helper to query current status

The GET /api/modules/<module_id>/questions endpoint is MODIFIED in quiz_routes.py
to enforce the lock (403 if not unlocked).
"""

import datetime
import logging
from flask import Blueprint, request
from bson import ObjectId

from src.db import get_db
from src.auth import get_current_user, student_required

logger = logging.getLogger(__name__)

module_unlock_bp = Blueprint('module_unlock', __name__)

# Minimum seconds to read content before reading timer is satisfied
DEFAULT_READ_SECONDS = 300   # 5 minutes


# ─────────────────────────────────────────────────────────────────────────────
#  Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_or_create_unlock(db, student_oid: ObjectId, module_oid: ObjectId) -> dict:
    """Fetch the unlock document; create it if it doesn't exist yet."""
    doc = db.moduleUnlocks.find_one({
        'studentId': student_oid,
        'moduleId':  module_oid
    })
    if doc:
        return doc

    # Fetch module config
    module = db.modules.find_one({'_id': module_oid}) or {}
    requires_video   = module.get('requiresVideoCompletion', True)
    requires_reading = module.get('requiresReadingTime', True)
    min_read_secs    = int(module.get('minReadSeconds', DEFAULT_READ_SECONDS))
    video_links      = module.get('videoLinks', [])

    # Build initial videoProgress list (one entry per video)
    video_progress = [
        {
            'videoIndex':   i,
            'durationSec':  0,
            'watchedSec':   0,
            'completed':    False,
            'lastUpdateAt': None
        }
        for i in range(len(video_links))
    ]

    now = datetime.datetime.utcnow()
    doc = {
        'studentId':          student_oid,
        'moduleId':           module_oid,
        'openedAt':           now,
        'readSecondsRequired': min_read_secs,
        'readTimerSatisfied': False,
        'readingStartedAt':   now,    # timer anchored to first open
        'videoRequired':      requires_video,
        'videoProgress':      video_progress,
        'videoSatisfied':     not requires_video or len(video_links) == 0,
        'isUnlocked':         False,
        'unlockedAt':         None,
    }

    # If no videos are required or module has no videos, video condition is already met
    if not requires_video or len(video_links) == 0:
        doc['videoSatisfied'] = True

    # If reading is not required, reading condition is already met
    if not requires_reading:
        doc['readTimerSatisfied'] = True

    db.moduleUnlocks.insert_one(doc)
    doc = db.moduleUnlocks.find_one({'studentId': student_oid, 'moduleId': module_oid})
    return doc


def _check_and_set_unlocked(db, doc: dict) -> dict:
    """
    If both conditions are satisfied and the module is not yet unlocked,
    set isUnlocked = True and record unlockedAt. Returns updated doc.
    """
    if doc.get('isUnlocked'):
        return doc   # already unlocked — nothing to do

    video_ok   = doc.get('videoSatisfied', False)
    reading_ok = doc.get('readTimerSatisfied', False)

    if video_ok and reading_ok:
        now = datetime.datetime.utcnow()
        db.moduleUnlocks.update_one(
            {'_id': doc['_id']},
            {'$set': {'isUnlocked': True, 'unlockedAt': now}}
        )
        doc = db.moduleUnlocks.find_one({'_id': doc['_id']})

    return doc


def _serialize_unlock(doc: dict) -> dict:
    """Convert ObjectIds and datetimes to serialisable primitives."""
    d = dict(doc)
    d['_id']       = str(d['_id'])
    d['studentId'] = str(d['studentId'])
    d['moduleId']  = str(d['moduleId'])

    for dt_field in ('openedAt', 'unlockedAt', 'readingStartedAt'):
        if d.get(dt_field) and hasattr(d[dt_field], 'isoformat'):
            d[dt_field] = d[dt_field].isoformat() + 'Z'

    for vp in d.get('videoProgress', []):
        if vp.get('lastUpdateAt') and hasattr(vp['lastUpdateAt'], 'isoformat'):
            vp['lastUpdateAt'] = vp['lastUpdateAt'].isoformat() + 'Z'

    return d


def _reading_seconds_elapsed(doc: dict) -> int:
    """How many seconds have elapsed since the module was first opened."""
    started = doc.get('readingStartedAt') or doc.get('openedAt')
    if not started:
        return 0
    now = datetime.datetime.utcnow()
    return max(0, int((now - started).total_seconds()))


# ─────────────────────────────────────────────────────────────────────────────
#  POST /api/modules/<module_id>/open
# ─────────────────────────────────────────────────────────────────────────────
@module_unlock_bp.post('/modules/<module_id>/open')
@student_required
def open_module(module_id):
    """
    Records the first time a student opens this module.
    Returns current unlock status + remaining times.
    """
    user = get_current_user()
    if not user:
        return {'error': 'Authentication required'}, 401

    try:
        student_oid = ObjectId(user['uid'])
        module_oid  = ObjectId(module_id)
    except Exception:
        return {'error': 'Invalid ID format'}, 400

    db  = get_db()
    doc = _get_or_create_unlock(db, student_oid, module_oid)

    # Check if reading timer is now satisfied
    if not doc.get('readTimerSatisfied') and doc.get('readSecondsRequired', DEFAULT_READ_SECONDS) > 0:
        elapsed = _reading_seconds_elapsed(doc)
        if elapsed >= doc.get('readSecondsRequired', DEFAULT_READ_SECONDS):
            db.moduleUnlocks.update_one(
                {'_id': doc['_id']},
                {'$set': {'readTimerSatisfied': True}}
            )
            doc = db.moduleUnlocks.find_one({'_id': doc['_id']})

    doc = _check_and_set_unlocked(db, doc)

    elapsed   = _reading_seconds_elapsed(doc)
    remaining = max(0, doc.get('readSecondsRequired', DEFAULT_READ_SECONDS) - elapsed)

    return {
        'unlockStatus': _serialize_unlock(doc),
        'readingElapsedSeconds': elapsed,
        'readingRemainingSeconds': remaining,
    }, 200


# ─────────────────────────────────────────────────────────────────────────────
#  POST /api/modules/<module_id>/video/progress
# ─────────────────────────────────────────────────────────────────────────────
@module_unlock_bp.post('/modules/<module_id>/video/progress')
@student_required
def update_video_progress(module_id):
    """
    Payload:
      { "videoIndex": 0, "durationSec": 600, "currentTimeSec": 590, "eventType": "timeupdate" | "ended" }

    eventType:
      "timeupdate" — periodic heartbeat while video is playing
      "ended"      — video finished playing  (automatically marks completed)
      "paused"     — optional, just records position
    """
    user = get_current_user()
    if not user:
        return {'error': 'Authentication required'}, 401

    try:
        student_oid = ObjectId(user['uid'])
        module_oid  = ObjectId(module_id)
    except Exception:
        return {'error': 'Invalid ID format'}, 400

    db      = get_db()
    payload = request.get_json(force=True) or {}

    video_index    = int(payload.get('videoIndex', 0))
    duration_sec   = float(payload.get('durationSec', 0))
    current_time   = float(payload.get('currentTimeSec', 0))
    event_type     = payload.get('eventType', 'timeupdate')

    doc = _get_or_create_unlock(db, student_oid, module_oid)

    # Guard: ignore calls if module already unlocked (no need to keep updating)
    # but we still accept them (frontend may not check before sending)

    video_progress = list(doc.get('videoProgress', []))

    # Ensure entry exists for this video index
    while len(video_progress) <= video_index:
        video_progress.append({
            'videoIndex':  len(video_progress),
            'durationSec': 0,
            'watchedSec':  0,
            'completed':   False,
            'lastUpdateAt': None
        })

    vp = video_progress[video_index]
    now = datetime.datetime.utcnow()

    # Update progress fields
    if duration_sec > 0:
        vp['durationSec'] = duration_sec
    vp['watchedSec']   = max(vp.get('watchedSec', 0), current_time)
    vp['lastUpdateAt'] = now

    # Mark completed if ended OR watched ≥ 95%
    already_completed = vp.get('completed', False)
    if not already_completed:
        watch_ratio = (current_time / duration_sec) if duration_sec > 0 else 0
        if event_type == 'ended' or watch_ratio >= 0.95:
            vp['completed'] = True

    video_progress[video_index] = vp

    # All videos must be completed for videoSatisfied = True
    all_completed = all(v.get('completed', False) for v in video_progress)
    video_satisfied = all_completed

    db.moduleUnlocks.update_one(
        {'_id': doc['_id']},
        {'$set': {
            'videoProgress':  video_progress,
            'videoSatisfied': video_satisfied,
        }}
    )
    doc = db.moduleUnlocks.find_one({'_id': doc['_id']})

    # Also re-check reading timer
    if not doc.get('readTimerSatisfied'):
        elapsed = _reading_seconds_elapsed(doc)
        if elapsed >= doc.get('readSecondsRequired', DEFAULT_READ_SECONDS):
            db.moduleUnlocks.update_one(
                {'_id': doc['_id']},
                {'$set': {'readTimerSatisfied': True}}
            )
            doc = db.moduleUnlocks.find_one({'_id': doc['_id']})

    doc = _check_and_set_unlocked(db, doc)

    return {
        'unlockStatus': _serialize_unlock(doc),
        'videoIndex': video_index,
        'videoCompleted': vp['completed'],
        'allVideosCompleted': all_completed,
    }, 200


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/modules/<module_id>/unlock-status
# ─────────────────────────────────────────────────────────────────────────────
@module_unlock_bp.get('/modules/<module_id>/unlock-status')
@student_required
def get_unlock_status(module_id):
    """
    Helper endpoint.
    Query param: ?studentId=<id>  (optional — falls back to JWT user)
    Returns the current unlock document.
    """
    user = get_current_user()
    if not user:
        return {'error': 'Authentication required'}, 401

    # Super-admins / admins may query on behalf of any student via ?studentId=
    student_id_str = request.args.get('studentId')
    if student_id_str and user.get('role') in ('super_admin', 'admin'):
        try:
            student_oid = ObjectId(student_id_str)
        except Exception:
            return {'error': 'Invalid studentId'}, 400
    else:
        student_oid = ObjectId(user['uid'])

    try:
        module_oid = ObjectId(module_id)
    except Exception:
        return {'error': 'Invalid module_id'}, 400

    db  = get_db()
    doc = db.moduleUnlocks.find_one({'studentId': student_oid, 'moduleId': module_oid})
    if not doc:
        return {'unlockStatus': None, 'isUnlocked': False}, 200

    # Re-check reading timer on every status check
    if not doc.get('readTimerSatisfied'):
        elapsed = _reading_seconds_elapsed(doc)
        if elapsed >= doc.get('readSecondsRequired', DEFAULT_READ_SECONDS):
            db.moduleUnlocks.update_one(
                {'_id': doc['_id']},
                {'$set': {'readTimerSatisfied': True}}
            )
            doc = db.moduleUnlocks.find_one({'_id': doc['_id']})

    doc = _check_and_set_unlocked(db, doc)
    elapsed   = _reading_seconds_elapsed(doc)
    remaining = max(0, doc.get('readSecondsRequired', DEFAULT_READ_SECONDS) - elapsed)

    return {
        'unlockStatus': _serialize_unlock(doc),
        'readingElapsedSeconds': elapsed,
        'readingRemainingSeconds': remaining,
        'isUnlocked': doc.get('isUnlocked', False),
    }, 200
