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
    answers = data.get('answers', [])  # List of {questionId, selectedOption}
    
    if not student_id:
        return {'error': 'Missing studentId'}, 400

    # verify contest exists
    contest = db.contests.find_one({'_id': ObjectId(contest_id)})
    if not contest:
        return {'error': 'Contest not found'}, 404

    # Calculate score
    module_ids = contest.get('moduleIds', [])
    # Get all questions
    questions = list(db.questions.find({'moduleId': {'$in': module_ids}}))
    question_map = {str(q['_id']): q for q in questions}

    marks_per_question = contest.get('marksPerQuestion', 1)
    negative_marking = contest.get('negativeMarking', 0)

    score = 0
    correct_count = 0
    wrong_count = 0
    
    processed_answers = []

    for ans in answers:
        q_id = ans.get('questionId')
        selected = int(ans.get('selectedOption', -1))
        
        q_obj = question_map.get(q_id)
        if q_obj:
            is_correct = (selected == q_obj.get('correctAnswer'))
            if is_correct:
                score += marks_per_question
                correct_count += 1
            elif selected != -1: # Answered but wrong
                score -= negative_marking
                wrong_count += 1
            
            processed_answers.append({
                'questionId': q_id,
                'selectedOption': selected,
                'isCorrect': is_correct
            })

    score = max(score, 0) # Ensure no negative total score? Or allow negative? Usually 0 floor.
    
    # Update leaderboard
    db.leaderboard.update_one({
        'contestId': ObjectId(contest_id),
        'studentId': ObjectId(student_id)
    }, {'$set': {
        'score': score,
        'answers': processed_answers,
        'submittedAt': __import__('datetime').datetime.utcnow(),
        'isSubmitted': True
    }}, upsert=True)

    # Recompute ranks
    entries = list(db.leaderboard.find({'contestId': ObjectId(contest_id)}))
    entries.sort(key=lambda e: (-int(e.get('score', 0))))
    for i, e in enumerate(entries, start=1):
        db.leaderboard.update_one({'_id': e['_id']}, {'$set': {'rank': i}})

    # Award winner badge to current #1
    if entries:
        top = entries[0]
        db.users.update_one({'_id': top['studentId']}, {'$addToSet': {'badges': BADGE_CONTEST_WINNER}})

    return {'status': 'submitted', 'score': score}


@contest_bp.get('/contests/result/<contest_id>/<student_id>')
def get_contest_result(contest_id, student_id):
    from bson import ObjectId
    db = get_db()
    
    entry = db.leaderboard.find_one({
        'contestId': ObjectId(contest_id),
        'studentId': ObjectId(student_id)
    })
    
    if not entry:
        return {'status': 'not_attempted'}
    
    result = {
        'status': 'submitted' if entry.get('isSubmitted') else 'joined',
        'score': entry.get('score', 0),
        'rank': entry.get('rank'),
        'answers': entry.get('answers', [])
    }

    # If submitted, enrich with correct answers for review
    if entry.get('isSubmitted'):
        review_answers = result['answers']
        q_ids = [ObjectId(a['questionId']) for a in review_answers if 'questionId' in a]
        if q_ids:
            # Fetch correct answers
            questions_data = list(db.questions.find({'_id': {'$in': q_ids}}, {'correctAnswer': 1}))
            q_map = {str(q['_id']): q.get('correctAnswer') for q in questions_data}
            
            for ans in review_answers:
                ans['correctOption'] = q_map.get(ans.get('questionId'))

    return result


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
