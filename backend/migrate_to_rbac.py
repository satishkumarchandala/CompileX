"""
migrate_to_rbac.py
------------------
One-time migration script to upgrade an existing 'compiler_gamified' database
to the new role-based schema introduced in v2.0.

What this script does:
  1. Adds missing fields to all 'users' documents
  2. Renames the old 'leaderboard' collection → 'contestLeaderboard'
  3. Backfills the 'userProgress' collection from quizAttempts + users
  4. Backfills the 'globalLeaderboard' collection from users
  5. Adds 'instructorId' to all existing quizAttempts (defaults to None)
  6. Creates a default 'super_admin' account (if none exists)

Run once:
    cd e:\Mini_Project\backend
    python migrate_to_rbac.py
"""
import os
import sys
import datetime

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient
from bson import ObjectId

# ── Connect ────────────────────────────────────────────────────────────────
uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
db_name = os.getenv('MONGODB_DB', 'compiler_gamified')
client = MongoClient(uri)
db = client[db_name]

print(f"Connected to '{db_name}' at {uri}")
print("=" * 60)


# ── 1. Patch existing users ────────────────────────────────────────────────
print("\n[1/6] Patching users collection...")
result = db.users.update_many(
    {'instructorId': {'$exists': False}},
    {'$set': {'instructorId': None, 'completedModules': [], 'createdBy': None}}
)
print(f"      Updated {result.modified_count} user(s) — added instructorId, completedModules, createdBy")

# Ensure 'admin' role is renamed to 'admin' (no change needed, but confirm)
result = db.users.update_many(
    {'role': {'$nin': ['super_admin', 'admin', 'student']}},
    {'$set': {'role': 'student'}}
)
print(f"      Normalised {result.modified_count} user(s) with invalid roles → 'student'")


# ── 2. Rename leaderboard → contestLeaderboard ───────────────────────────
print("\n[2/6] Renaming 'leaderboard' → 'contestLeaderboard'...")
if 'leaderboard' in db.list_collection_names():
    old_docs = list(db.leaderboard.find({}))
    if old_docs:
        # Add new fields with defaults
        for doc in old_docs:
            doc.setdefault('studentName',  '')
            doc.setdefault('instructorId', None)
            doc.setdefault('correctCount', 0)
            doc.setdefault('wrongCount',   0)
            doc.setdefault('isSubmitted',  True)

        db.contestLeaderboard.insert_many(old_docs, ordered=False)
        print(f"      Migrated {len(old_docs)} leaderboard entries")
    db.leaderboard.drop()
    print("      Dropped old 'leaderboard' collection")
else:
    print("      'leaderboard' collection not found — skipping")


# ── 3. Backfill userProgress ──────────────────────────────────────────────
print("\n[3/6] Backfilling 'userProgress' collection...")
students = list(db.users.find({'role': 'student'}))
now = datetime.datetime.utcnow()
up_count = 0

for student in students:
    sid = student['_id']
    total_attempts = db.quizAttempts.count_documents({'studentId': sid})
    completed_oids = student.get('completedModules', [])

    doc = {
        'studentId':            sid,
        'instructorId':         student.get('instructorId'),
        'name':                 student.get('name', ''),
        'xp':                   student.get('xp', 0),
        'level':                student.get('level', 1),
        'badges':               student.get('badges', []),
        'completedModulesCount': len(completed_oids),
        'completedModules':     completed_oids,
        'totalAttempts':        total_attempts,
        'lastActiveAt':         now,
        'updatedAt':            now
    }
    db.userProgress.update_one(
        {'studentId': sid},
        {'$setOnInsert': doc},
        upsert=True
    )
    up_count += 1

print(f"      Created/verified {up_count} userProgress documents")


# ── 4. Backfill globalLeaderboard ─────────────────────────────────────────
print("\n[4/6] Backfilling 'globalLeaderboard' collection...")
gl_count = 0
for student in students:
    sid = student['_id']
    completed_oids = student.get('completedModules', [])
    doc = {
        'studentId':            sid,
        'studentName':          student.get('name', ''),
        'instructorId':         student.get('instructorId'),
        'xp':                   student.get('xp', 0),
        'level':                student.get('level', 1),
        'completedModulesCount': len(completed_oids),
        'rank':                 9999,  # will be recalculated below
        'updatedAt':            now
    }
    db.globalLeaderboard.update_one(
        {'studentId': sid},
        {'$setOnInsert': doc},
        upsert=True
    )
    gl_count += 1

# Recompute ranks
entries = list(db.globalLeaderboard.find(
    {}, {'_id': 1, 'xp': 1, 'level': 1, 'completedModulesCount': 1}
))
entries.sort(key=lambda e: (
    -e.get('xp', 0), -e.get('level', 1), -e.get('completedModulesCount', 0)
))
for rank, entry in enumerate(entries, start=1):
    db.globalLeaderboard.update_one({'_id': entry['_id']}, {'$set': {'rank': rank}})

print(f"      Created/verified {gl_count} globalLeaderboard entries with ranks assigned")


# ── 5. Backfill quizAttempts.instructorId ────────────────────────────────
print("\n[5/6] Backfilling 'instructorId' in quizAttempts...")
student_instructor_map = {
    s['_id']: s.get('instructorId') for s in students
}
qa_count = 0
for attempt in db.quizAttempts.find({'instructorId': {'$exists': False}}):
    sid = attempt.get('studentId')
    instructor_id = student_instructor_map.get(sid)
    db.quizAttempts.update_one(
        {'_id': attempt['_id']},
        {'$set': {'instructorId': instructor_id, 'isFirstCompletion': False}}
    )
    qa_count += 1
print(f"      Patched {qa_count} quizAttempts")


# ── 6. Create default super_admin if none exists ─────────────────────────
print("\n[6/6] Checking for super_admin account...")
existing_sa = db.users.find_one({'role': 'super_admin'})
if existing_sa:
    print(f"      Super Admin already exists: {existing_sa['email']} — skipping")
else:
    import bcrypt
    default_password = 'SuperAdmin@123'
    pwd_hash = bcrypt.hashpw(
        default_password.encode('utf-8'), bcrypt.gensalt()
    ).decode('utf-8')

    db.users.insert_one({
        'name':             'Super Admin',
        'email':            'superadmin@compilex.app',
        'passwordHash':     pwd_hash,
        'role':             'super_admin',
        'instructorId':     None,
        'xp':               0,
        'level':            1,
        'badges':           [],
        'completedModules': [],
        'createdAt':        now,
        'createdBy':        None
    })
    print("      ✅ Created default Super Admin:")
    print("         Email:    superadmin@compilex.app")
    print("         Password: SuperAdmin@123")
    print("      ⚠️  CHANGE THIS PASSWORD IMMEDIATELY after first login!")


print("\n" + "=" * 60)
print("Migration complete! ✅")
print("=" * 60)
