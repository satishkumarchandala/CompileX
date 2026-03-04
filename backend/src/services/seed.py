"""
seed.py — Idempotent initial data seeding.
Runs on every app startup; safe to call multiple times.
"""
import datetime
from src.db import get_db


def seed_initial_data():
    db = get_db()

    # ── Seed default Course ────────────────────────────────────────────────
    course = db.courses.find_one({'title': 'Compiler Design'})
    if not course:
        db.courses.insert_one({
            'title':       'Compiler Design',
            'description': 'Learn compiler design via gamified modules.',
            'modules':     [1, 2, 3, 4, 5],
            'createdBy':   None,
            'createdAt':   datetime.datetime.utcnow()
        })
        course = db.courses.find_one({'title': 'Compiler Design'})

    # ── Seed Modules ───────────────────────────────────────────────────────
    titles = {
        1: 'Lexical Analysis',
        2: 'Syntax Analysis',
        3: 'Semantic Analysis',
        4: 'Intermediate Code Generation',
        5: 'Code Optimization & Code Generation'
    }
    video_links = {
        1: ['https://www.youtube.com/watch?v=UwFsS33xu0Q'],
        2: ['https://www.youtube.com/watch?v=Qkdc6K3VPBs'],
        3: ['https://www.youtube.com/watch?v=_CJN1qpLv-k'],
        4: ['https://www.youtube.com/watch?v=1GSjbWt0c9M'],
        5: ['https://www.youtube.com/watch?v=FnGCDLhaxKU']
    }
    for mno, title in titles.items():
        if not db.modules.find_one({'courseId': course['_id'], 'moduleNo': mno}):
            db.modules.insert_one({
                'courseId':   course['_id'],
                'moduleNo':   mno,
                'title':      title,
                'context':    f'Notes for {title}.',
                'videoLinks': video_links.get(mno, []),
                'createdBy':  None,
                'createdAt':  datetime.datetime.utcnow()
            })
