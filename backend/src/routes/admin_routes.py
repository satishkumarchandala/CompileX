from flask import Blueprint, request
from src.db import get_db
from src.services.pdf_service import extract_text_from_pdf
from src.services.question_service import generate_mcqs_from_text

admin_bp = Blueprint('admin', __name__)


@admin_bp.get('/stats')
def get_admin_stats():
    """Get dashboard statistics for admin"""
    db = get_db()
    
    total_users = db.users.count_documents({})
    total_modules = db.modules.count_documents({})
    total_questions = db.questions.count_documents({})
    total_contests = db.contests.count_documents({})
    total_quiz_attempts = db.quizAttempts.count_documents({})
    
    # Get user role breakdown
    admin_count = db.users.count_documents({'role': 'admin'})
    student_count = db.users.count_documents({'role': 'student'})
    
    return {
        'totalUsers': total_users,
        'adminCount': admin_count,
        'studentCount': student_count,
        'totalModules': total_modules,
        'totalQuestions': total_questions,
        'totalContests': total_contests,
        'totalQuizAttempts': total_quiz_attempts
    }


@admin_bp.post('/module/create')
def create_module():
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    course_id = data.get('courseId')
    try:
        if course_id:
            ObjectId(course_id)
    except:
        return {'error': 'Invalid Course ID format'}, 400
    module_no = data.get('moduleNo')
    title = data.get('title')
    context = data.get('context')
    video_links = data.get('videoLinks', [])
    if not (course_id and module_no and title):
        return {'error': 'Missing fields'}, 400
    mod = {
        'courseId': ObjectId(course_id),
        'moduleNo': int(module_no),
        'title': title,
        'context': context or '',
        'videoLinks': video_links
    }
    db.modules.insert_one(mod)
    return {'status': 'created'}


@admin_bp.put('/module/update/<module_id>')
def update_module(module_id):
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    
    update_data = {}
    if 'courseId' in data:
        update_data['courseId'] = ObjectId(data['courseId'])
    if 'moduleNo' in data:
        update_data['moduleNo'] = int(data['moduleNo'])
    if 'title' in data:
        update_data['title'] = data['title']
    if 'context' in data:
        update_data['context'] = data['context']
    if 'videoLinks' in data:
        update_data['videoLinks'] = data['videoLinks']
    
    if not update_data:
        return {'error': 'No fields to update'}, 400
    
    result = db.modules.update_one(
        {'_id': ObjectId(module_id)},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        return {'error': 'Module not found'}, 404
    
    return {'status': 'updated', 'modifiedCount': result.modified_count}


@admin_bp.delete('/module/delete/<module_id>')
def delete_module(module_id):
    from bson import ObjectId
    db = get_db()
    
    # Delete the module
    result = db.modules.delete_one({'_id': ObjectId(module_id)})
    
    if result.deleted_count == 0:
        return {'error': 'Module not found'}, 404
    
    # Also delete all questions associated with this module
    db.questions.delete_many({'moduleId': ObjectId(module_id)})
    
    return {'status': 'deleted', 'deletedCount': result.deleted_count}


@admin_bp.post('/question/create')
def create_question():
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    module_id = data.get('moduleId')
    question = data.get('question')
    options = data.get('options')
    correct = data.get('correctAnswer')
    difficulty = data.get('difficulty', 'easy')
    if not (module_id and question and options and correct is not None):
        return {'error': 'Missing fields'}, 400
    q = {
        'moduleId': ObjectId(module_id),
        'question': question,
        'options': options,
        'correctAnswer': int(correct),
        'difficulty': difficulty,
        'source': 'manual'
    }
    db.questions.insert_one(q)
    return {'status': 'created'}


@admin_bp.get('/module/<module_id>/questions')
def get_module_questions(module_id):
    from bson import ObjectId
    db = get_db()
    
    questions = list(db.questions.find({'moduleId': ObjectId(module_id)}))
    for q in questions:
        q['_id'] = str(q['_id'])
        q['moduleId'] = str(q['moduleId'])
    
    return {'questions': questions}


@admin_bp.put('/question/update/<question_id>')
def update_question(question_id):
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    
    update_data = {}
    if 'question' in data:
        update_data['question'] = data['question']
    if 'options' in data:
        update_data['options'] = data['options']
    if 'correctAnswer' in data:
        update_data['correctAnswer'] = int(data['correctAnswer'])
    if 'difficulty' in data:
        update_data['difficulty'] = data['difficulty']
    
    if not update_data:
        return {'error': 'No fields to update'}, 400
    
    result = db.questions.update_one(
        {'_id': ObjectId(question_id)},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        return {'error': 'Question not found'}, 404
    
    return {'status': 'updated', 'modifiedCount': result.modified_count}


@admin_bp.delete('/question/delete/<question_id>')
def delete_question(question_id):
    from bson import ObjectId
    db = get_db()
    
    result = db.questions.delete_one({'_id': ObjectId(question_id)})
    
    if result.deleted_count == 0:
        return {'error': 'Question not found'}, 404
    
    return {'status': 'deleted', 'deletedCount': result.deleted_count}


@admin_bp.post('/pdf/upload')
def upload_pdf():
    # Expect multipart/form-data with file
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400
    file = request.files['file']
    pdf_bytes = file.read()
    text = extract_text_from_pdf(pdf_bytes)
    generated = generate_mcqs_from_text(text, max_questions=10)
    return {'extractedText': text[:1000], 'generatedQuestions': generated}


@admin_bp.post('/pdf/generate-module')
def generate_module_from_pdf():
    """Generate complete module with questions from uploaded PDF"""
    from bson import ObjectId
    
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400
    
    # Get form data
    file = request.files['file']
    course_id = request.form.get('courseId')
    module_title = request.form.get('moduleTitle', 'Auto-Generated Module')
    num_questions = int(request.form.get('numQuestions', 10))
    
    if not course_id:
        return {'error': 'Course ID is required'}, 400
    
    db = get_db()
    
    # Extract text from PDF
    pdf_bytes = file.read()
    text = extract_text_from_pdf(pdf_bytes)
    
    if not text or len(text) < 100:
        return {'error': 'Could not extract meaningful text from PDF'}, 400
    
    # Determine next module number
    existing_modules = list(db.modules.find({'courseId': ObjectId(course_id)}).sort('moduleNo', -1).limit(1))
    next_module_no = (existing_modules[0]['moduleNo'] + 1) if existing_modules else 1
    
    # Create module
    module = {
        'courseId': ObjectId(course_id),
        'moduleNo': next_module_no,
        'title': module_title,
        'context': text[:2000],  # Store first 2000 chars as context
        'videoLinks': [],
        'generatedFromPDF': True
    }
    module_result = db.modules.insert_one(module)
    module_id = module_result.inserted_id
    
    # Generate questions from text
    generated_questions = generate_mcqs_from_text(text, max_questions=num_questions)
    
    # Insert questions into database
    questions_inserted = []
    for q_data in generated_questions:
        question = {
            'moduleId': module_id,
            'question': q_data['question'],
            'options': q_data['options'],
            'correctAnswer': q_data['correctAnswer'],
            'difficulty': q_data.get('difficulty', 'medium'),
            'generatedFromPDF': True
        }
        q_result = db.questions.insert_one(question)
        questions_inserted.append(str(q_result.inserted_id))
    
    return {
        'success': True,
        'moduleId': str(module_id),
        'moduleNo': next_module_no,
        'moduleTitle': module_title,
        'questionsCreated': len(questions_inserted),
        'extractedTextLength': len(text),
        'message': f'Successfully created module {next_module_no} with {len(questions_inserted)} questions'
    }


@admin_bp.post('/contest/create')
def create_contest():
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    title = data.get('title')
    try:
        module_ids = [ObjectId(m) for m in data.get('moduleIds', [])]
    except:
        return {'error': 'Invalid Module ID in list'}, 400
    start = data.get('startTime')
    end = data.get('endTime')
    duration = int(data.get('durationMinutes', 30))
    marks_per_q = int(data.get('marksPerQuestion', 1))
    negative = float(data.get('negativeMarking', 0))
    tie_breaker = data.get('tieBreak', 'time')
    if not title:
        return {'error': 'Missing title'}, 400
    contest = {
        'title': title,
        'moduleIds': module_ids,
        'startTime': start,
        'endTime': end,
        'durationMinutes': duration,
        'marksPerQuestion': marks_per_q,
        'negativeMarking': negative,
        'tieBreak': tie_breaker
    }
    result = db.contests.insert_one(contest)
    contest_id = result.inserted_id

    # Handle custom questions
    custom_questions = data.get('customQuestions', [])
    if custom_questions:
        for q_data in custom_questions:
            question = {
                'contestId': contest_id,
                'question': q_data['question'],
                'options': q_data['options'],
                'correctAnswer': int(q_data['correctAnswer']),
                'difficulty': 'medium', # Default
                'source': 'custom_contest'
            }
            db.questions.insert_one(question)

    return {'status': 'created', 'contestId': str(contest_id)}


@admin_bp.put('/contest/update/<contest_id>')
def update_contest(contest_id):
    from bson import ObjectId
    db = get_db()
    data = request.get_json(force=True)
    
    update_data = {}
    if 'title' in data:
        update_data['title'] = data['title']
    if 'moduleIds' in data:
        update_data['moduleIds'] = [ObjectId(m) for m in data['moduleIds']]
    if 'startTime' in data:
        update_data['startTime'] = data['startTime']
    if 'endTime' in data:
        update_data['endTime'] = data['endTime']
    if 'durationMinutes' in data:
        update_data['durationMinutes'] = int(data['durationMinutes'])
    if 'marksPerQuestion' in data:
        update_data['marksPerQuestion'] = int(data['marksPerQuestion'])
    if 'negativeMarking' in data:
        update_data['negativeMarking'] = float(data['negativeMarking'])
    if 'tieBreak' in data:
        update_data['tieBreak'] = data['tieBreak']
    
    if not update_data:
        return {'error': 'No fields to update'}, 400
    
    result = db.contests.update_one(
        {'_id': ObjectId(contest_id)},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        return {'error': 'Contest not found'}, 404
    
    return {'status': 'updated', 'modifiedCount': result.modified_count}


@admin_bp.delete('/contest/delete/<contest_id>')
def delete_contest(contest_id):
    from bson import ObjectId
    db = get_db()
    
    # Delete the contest
    result = db.contests.delete_one({'_id': ObjectId(contest_id)})
    
    if result.deleted_count == 0:
        return {'error': 'Contest not found'}, 404
    
    # Also delete all leaderboard entries for this contest
    db.leaderboard.delete_many({'contestId': ObjectId(contest_id)})
    
    return {'status': 'deleted', 'deletedCount': result.deleted_count}
