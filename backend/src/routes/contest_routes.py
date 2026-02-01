from flask import Blueprint, request
from src.db import get_db
from src.models import BADGE_CONTEST_WINNER

contest_bp = Blueprint('contest', __name__)


@contest_bp.get('/contests/<contest_id>/questions')
def get_contest_questions(contest_id):
    from bson import ObjectId
    db = get_db()
    
    # Get contest details
    contest = db.contests.find_one({'_id': ObjectId(contest_id)})
    if not contest:
        return {'error': 'Contest not found'}, 404
    
    # Get all questions from the contest's modules
    module_ids = contest.get('moduleIds', [])
    questions = list(db.questions.find({'moduleId': {'$in': module_ids}}))
    
    for q in questions:
        q['_id'] = str(q['_id'])
        q['moduleId'] = str(q['moduleId'])
    
    return {'questions': questions, 'contest': {
        '_id': str(contest['_id']),
        'title': contest['title'],
        'durationMinutes': contest.get('durationMinutes', 30),
        'negativeMarking': contest.get('negativeMarking', 0),
        'marksPerQuestion': contest.get('marksPerQuestion', 1)
    }}


@contest_bp.get('/contests')
def list_contests():
    db = get_db()
    contests = list(db.contests.find({}))
    for c in contests:
        c['_id'] = str(c['_id'])
        c['moduleIds'] = [str(m) for m in c.get('moduleIds', [])]
    return {'contests': contests}


@contest_bp.post('/contests/join/<contest_id>')
def join_contest(contest_id):
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    student_id = data.get('studentId')
    if not student_id:
        return {'error': 'Missing studentId'}, 400
    db.leaderboard.update_one({
        'contestId': ObjectId(contest_id),
        'studentId': ObjectId(student_id)
    }, {'$setOnInsert': {
        'score': 0,
        'timeTaken': 0,
        'rank': None
    }}, upsert=True)
    return {'status': 'joined'}


@contest_bp.post('/contests/submit/<contest_id>')
def submit_contest(contest_id):
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    student_id = data.get('studentId')
    score = int(data.get('score', 0))
    time_taken = int(data.get('timeTaken', 0))
    negative = float(data.get('negativeMarking', 0))
    total_questions = int(data.get('totalQuestions', 0))

    # Apply negative marking if provided
    if negative and total_questions:
        wrong = max(total_questions - score, 0)
        score = max(int(score - wrong * negative), 0)

    db.leaderboard.update_one({
        'contestId': ObjectId(contest_id),
        'studentId': ObjectId(student_id)
    }, {'$set': {
        'score': score,
        'timeTaken': time_taken
    }}, upsert=True)

    # Recompute ranks (score desc, time asc)
    entries = list(db.leaderboard.find({'contestId': ObjectId(contest_id)}))
    entries.sort(key=lambda e: (-int(e.get('score', 0)), int(e.get('timeTaken', 0))))
    for i, e in enumerate(entries, start=1):
        db.leaderboard.update_one({'_id': e['_id']}, {'$set': {'rank': i}})

    # Award winner badge to current #1
    if entries:
        top = entries[0]
        db.users.update_one({'_id': top['studentId']}, {'$addToSet': {'badges': BADGE_CONTEST_WINNER}})

    return {'status': 'submitted'}


@contest_bp.get('/contests/leaderboard/<contest_id>')
def contest_leaderboard(contest_id):
    from bson import ObjectId
    db = get_db()
    lb = list(db.leaderboard.find({'contestId': ObjectId(contest_id)}))
    for e in lb:
        e['_id'] = str(e['_id'])
        e['contestId'] = str(e['contestId'])
        e['studentId'] = str(e['studentId'])
    lb.sort(key=lambda e: (-int(e.get('score', 0)), int(e.get('timeTaken', 0))))
    return {'leaderboard': lb}
