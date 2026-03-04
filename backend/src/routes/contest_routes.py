"""
Contest Routes — /api/
Accessible by all authenticated users (students can join & submit).
Uses the renamed 'contestLeaderboard' collection.
"""
import datetime
from flask import Blueprint, request
from bson import ObjectId

from src.db import get_db
from src.models import BADGE_CONTEST_WINNER
from src.leaderboard_service import update_contest_ranks

contest_bp = Blueprint('contest', __name__)


# ─────────────────────────────────────────────────────────────────────────────
#  List all Contests
# ─────────────────────────────────────────────────────────────────────────────
@contest_bp.get('/contests')
def list_contests():
    db       = get_db()
    contests = list(db.contests.find({'visibleToAll': True}))
    # Also include contests without the visibleToAll field (legacy)
    if not contests:
        contests = list(db.contests.find({}))
    else:
        contests += list(db.contests.find({'visibleToAll': {'$exists': False}}))

    result = []
    for c in contests:
        result.append({
            '_id':             str(c['_id']),
            'title':           c['title'],
            'startTime':       c.get('startTime'),
            'endTime':         c.get('endTime'),
            'durationMinutes': c.get('durationMinutes', 30),
            'marksPerQuestion': c.get('marksPerQuestion', 1),
            'negativeMarking': c.get('negativeMarking', 0),
            'moduleIds':       [str(m) for m in c.get('moduleIds', [])]
        })
    return {'contests': result}


# ─────────────────────────────────────────────────────────────────────────────
#  Get Contest Questions
# ─────────────────────────────────────────────────────────────────────────────
@contest_bp.get('/contests/<contest_id>/questions')
def get_contest_questions(contest_id):
    db      = get_db()
    contest = db.contests.find_one({'_id': ObjectId(contest_id)})
    if not contest:
        return {'error': 'Contest not found'}, 404

    module_ids = contest.get('moduleIds', [])
    query = {
        '$or': [
            {'moduleId':  {'$in': module_ids}},
            {'contestId': ObjectId(contest_id)}
        ]
    }
    questions = list(db.questions.find(query))
    for q in questions:
        q['_id']      = str(q['_id'])
        q['moduleId'] = str(q.get('moduleId', ''))

    return {
        'questions': questions,
        'contest': {
            '_id':             str(contest['_id']),
            'title':           contest['title'],
            'durationMinutes': contest.get('durationMinutes', 30),
            'negativeMarking': contest.get('negativeMarking', 0),
            'marksPerQuestion': contest.get('marksPerQuestion', 1)
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Join Contest
# ─────────────────────────────────────────────────────────────────────────────
@contest_bp.post('/contests/join/<contest_id>')
def join_contest(contest_id):
    db   = get_db()
    data = request.get_json(force=True)

    student_id = data.get('studentId')
    if not student_id:
        return {'error': 'studentId is required'}, 400

    student_oid = ObjectId(student_id)
    student     = db.users.find_one({'_id': student_oid}, {'name': 1, 'instructorId': 1})
    if not student:
        return {'error': 'Student not found'}, 404

    db.contestLeaderboard.update_one(
        {
            'contestId': ObjectId(contest_id),
            'studentId': student_oid
        },
        {'$setOnInsert': {
            'studentName':  student.get('name', ''),
            'instructorId': student.get('instructorId'),
            'score':        0,
            'correctCount': 0,
            'wrongCount':   0,
            'timeTaken':    0,
            'rank':         None,
            'isSubmitted':  False
        }},
        upsert=True
    )
    return {'status': 'joined'}


# ─────────────────────────────────────────────────────────────────────────────
#  Submit Contest
# ─────────────────────────────────────────────────────────────────────────────
@contest_bp.post('/contests/submit/<contest_id>')
def submit_contest(contest_id):
    db   = get_db()
    data = request.get_json(force=True)

    student_id = data.get('studentId')
    answers    = data.get('answers', [])   # [{questionId, selectedOption}]
    time_taken = int(data.get('timeTaken', 0))

    if not student_id:
        return {'error': 'studentId is required'}, 400

    contest_oid = ObjectId(contest_id)
    student_oid = ObjectId(student_id)

    contest = db.contests.find_one({'_id': contest_oid})
    if not contest:
        return {'error': 'Contest not found'}, 404

    # Prevent double submission
    existing = db.contestLeaderboard.find_one({
        'contestId': contest_oid,
        'studentId': student_oid,
        'isSubmitted': True
    })
    if existing:
        return {'error': 'Already submitted'}, 409

    # Grade answers
    module_ids = contest.get('moduleIds', [])
    query = {
        '$or': [
            {'moduleId':  {'$in': module_ids}},
            {'contestId': contest_oid}
        ]
    }
    questions    = list(db.questions.find(query))
    question_map = {str(q['_id']): q for q in questions}

    marks_per_q = contest.get('marksPerQuestion', 1)
    negative    = contest.get('negativeMarking', 0)

    score         = 0
    correct_count = 0
    wrong_count   = 0
    processed     = []

    for ans in answers:
        q_id     = ans.get('questionId')
        selected = int(ans.get('selectedOption', -1))
        q_obj    = question_map.get(q_id)
        if q_obj:
            is_correct = (selected == q_obj.get('correctAnswer'))
            if is_correct:
                score         += marks_per_q
                correct_count += 1
            elif selected != -1:
                score       -= negative
                wrong_count += 1
            processed.append({
                'questionId':     q_id,
                'selectedOption': selected,
                'isCorrect':      is_correct
            })

    score = max(score, 0)

    student = db.users.find_one({'_id': student_oid}, {'name': 1, 'instructorId': 1})

    # Upsert submission
    db.contestLeaderboard.update_one(
        {'contestId': contest_oid, 'studentId': student_oid},
        {'$set': {
            'studentName':  student.get('name', '') if student else '',
            'instructorId': student.get('instructorId') if student else None,
            'score':        score,
            'correctCount': correct_count,
            'wrongCount':   wrong_count,
            'timeTaken':    time_taken,
            'answers':      processed,
            'isSubmitted':  True,
            'submittedAt':  datetime.datetime.utcnow()
        }},
        upsert=True
    )

    # Recompute ranks
    sorted_entries = update_contest_ranks(db, contest_oid)

    # Award winner badge to #1
    if sorted_entries:
        top = sorted_entries[0]
        top_entry = db.contestLeaderboard.find_one({'_id': top['_id']})
        if top_entry:
            db.users.update_one(
                {'_id': top_entry['studentId']},
                {'$addToSet': {'badges': BADGE_CONTEST_WINNER}}
            )

    # Fetch this student's current rank
    my_entry = db.contestLeaderboard.find_one(
        {'contestId': contest_oid, 'studentId': student_oid},
        {'rank': 1}
    )

    return {
        'status':       'submitted',
        'score':        score,
        'correctCount': correct_count,
        'wrongCount':   wrong_count,
        'rank':         my_entry.get('rank') if my_entry else None
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Contest Result (for a specific student)
# ─────────────────────────────────────────────────────────────────────────────
@contest_bp.get('/contests/result/<contest_id>/<student_id>')
def get_contest_result(contest_id, student_id):
    db    = get_db()
    entry = db.contestLeaderboard.find_one({
        'contestId': ObjectId(contest_id),
        'studentId': ObjectId(student_id)
    })

    if not entry:
        return {'status': 'not_attempted'}

    result = {
        'status':       'submitted' if entry.get('isSubmitted') else 'joined',
        'score':        entry.get('score', 0),
        'correctCount': entry.get('correctCount', 0),
        'wrongCount':   entry.get('wrongCount', 0),
        'rank':         entry.get('rank'),
        'answers':      entry.get('answers', [])
    }

    # Enrich answers with correct options if submitted
    if entry.get('isSubmitted'):
        review = result['answers']
        q_ids  = [ObjectId(a['questionId']) for a in review if 'questionId' in a]
        if q_ids:
            q_data = list(db.questions.find({'_id': {'$in': q_ids}}, {'correctAnswer': 1}))
            q_map  = {str(q['_id']): q.get('correctAnswer') for q in q_data}
            for ans in review:
                ans['correctOption'] = q_map.get(ans.get('questionId'))

    return result


# ─────────────────────────────────────────────────────────────────────────────
#  Contest Leaderboard
# ─────────────────────────────────────────────────────────────────────────────
@contest_bp.get('/contests/leaderboard/<contest_id>')
def contest_leaderboard(contest_id):
    db  = get_db()
    lb  = list(
        db.contestLeaderboard.find({'contestId': ObjectId(contest_id)})
          .sort([('rank', 1)])
    )
    result = []
    for e in lb:
        result.append({
            'rank':         e.get('rank'),
            'studentId':    str(e['studentId']),
            'studentName':  e.get('studentName', ''),
            'instructorId': str(e['instructorId']) if e.get('instructorId') else None,
            'score':        e.get('score', 0),
            'correctCount': e.get('correctCount', 0),
            'wrongCount':   e.get('wrongCount', 0),
            'timeTaken':    e.get('timeTaken', 0),
            'isSubmitted':  e.get('isSubmitted', False)
        })
    return {'leaderboard': result}


# ─────────────────────────────────────────────────────────────────────────────
#  Global Leaderboard (public — visible to all students)
# ─────────────────────────────────────────────────────────────────────────────
@contest_bp.get('/leaderboard/global')
def global_leaderboard():
    db      = get_db()
    entries = list(db.globalLeaderboard.find({}).sort('rank', 1).limit(100))
    result  = []
    for e in entries:
        result.append({
            'rank':                  e.get('rank'),
            'studentId':             str(e['studentId']),
            'studentName':           e.get('studentName', ''),
            'xp':                    e.get('xp', 0),
            'level':                 e.get('level', 1),
            'completedModulesCount': e.get('completedModulesCount', 0)
        })
    return {'leaderboard': result}
