"""
Admin Routes — /api/admin/
Accessible by 'admin' (course instructor) and 'super_admin'.
Covers: module/question/contest CRUD + instructor-specific student tracking.
"""
import datetime
from flask import Blueprint, request
from bson import ObjectId

from src.db import get_db
from src.auth import admin_required, get_current_user
from src.services.pdf_service import extract_text_from_pdf
from src.services.question_service import generate_mcqs_from_text
from src.leaderboard_service import update_contest_ranks

admin_bp = Blueprint('admin', __name__)


# ─────────────────────────────────────────────────────────────────────────────
#  Dashboard Statistics
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.get('/stats')
@admin_required
def get_admin_stats():
    """Stats scoped to the calling admin's assigned students."""
    caller = get_current_user()
    db     = get_db()

    role = caller.get('role')
    base_filter = {}
    if role == 'admin':
        # Scope to students assigned to this instructor
        instructor_oid = ObjectId(caller['uid'])
        assigned_ids   = [
            a['studentId']
            for a in db.instructor_assignments.find(
                {'instructorId': instructor_oid}, {'studentId': 1}
            )
        ]
        base_filter = {'_id': {'$in': assigned_ids}}

    total_students   = db.users.count_documents({**base_filter, 'role': 'student'})
    total_modules    = db.modules.count_documents({})
    total_questions  = db.questions.count_documents({})
    total_contests   = db.contests.count_documents({})

    # Attempt stats scoped appropriately
    attempt_filter = {}
    if role == 'admin':
        attempt_filter['instructorId'] = ObjectId(caller['uid'])

    total_attempts = db.quizAttempts.count_documents(attempt_filter)

    return {
        'totalStudents':     total_students,
        'totalModules':      total_modules,
        'totalQuestions':    total_questions,
        'totalContests':     total_contests,
        'totalQuizAttempts': total_attempts
    }


# ─────────────────────────────────────────────────────────────────────────────
#  My Students (Instructor Dashboard)
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.get('/my-students')
@admin_required
def get_my_students():
    """Return all students assigned to the calling instructor with their progress."""
    caller         = get_current_user()
    db             = get_db()
    instructor_oid = ObjectId(caller['uid'])

    assignments = list(db.instructor_assignments.find(
        {'instructorId': instructor_oid}, {'studentId': 1}
    ))
    student_ids = [a['studentId'] for a in assignments]

    students = list(db.users.find(
        {'_id': {'$in': student_ids}},
        {'passwordHash': 0}
    ))

    result = []
    for s in students:
        s_id = s['_id']
        # Fetch progress snapshot (fast, O(1))
        progress = db.userProgress.find_one({'studentId': s_id}) or {}
        result.append({
            '_id':                   str(s_id),
            'name':                  s['name'],
            'email':                 s['email'],
            'xp':                    s.get('xp', 0),
            'level':                 s.get('level', 1),
            'badges':                s.get('badges', []),
            'completedModulesCount': len(s.get('completedModules', [])),
            'totalAttempts':         progress.get('totalAttempts', 0),
            'lastActiveAt':          (progress.get('lastActiveAt') or '').isoformat()
                                        if progress.get('lastActiveAt') else None
        })

    return {'students': result, 'total': len(result)}


# ─────────────────────────────────────────────────────────────────────────────
#  Detailed progress for a single student
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.get('/student/<student_id>/progress')
@admin_required
def get_student_progress(student_id):
    """Return full progress for a student. Admin is scoped to their own students."""
    caller = get_current_user()
    db     = get_db()

    student_oid    = ObjectId(student_id)
    instructor_oid = ObjectId(caller['uid'])

    # Verify assignment (super_admin can see all)
    if caller.get('role') == 'admin':
        assignment = db.instructor_assignments.find_one({
            'instructorId': instructor_oid,
            'studentId':    student_oid
        })
        if not assignment:
            return {'error': 'Student not assigned to you'}, 403

    student = db.users.find_one({'_id': student_oid}, {'passwordHash': 0})
    if not student:
        return {'error': 'Student not found'}, 404

    # Quiz attempts for this student
    attempts = list(db.quizAttempts.find({'studentId': student_oid}).sort('attemptedAt', -1))
    attempt_list = []
    for a in attempts:
        attempt_list.append({
            'moduleId':          str(a['moduleId']),
            'score':             a['score'],
            'total':             a['total'],
            'xpEarned':          a.get('xpEarned', 0),
            'timeTaken':         a.get('timeTaken', 0),
            'isFirstCompletion': a.get('isFirstCompletion', False),
            'attemptedAt':       a['attemptedAt'].isoformat() + 'Z'
        })

    # Completed modules with titles
    completed_module_oids = [ObjectId(m) for m in (student.get('completedModules') or [])]
    modules_map = {}
    if completed_module_oids:
        for m in db.modules.find({'_id': {'$in': completed_module_oids}}, {'title': 1, 'moduleNo': 1}):
            modules_map[str(m['_id'])] = {'title': m['title'], 'moduleNo': m['moduleNo']}

    completed_modules_detail = [
        {**modules_map.get(str(m), {}), 'moduleId': str(m)}
        for m in completed_module_oids
    ]

    return {
        'studentId':              str(student['_id']),
        'name':                   student['name'],
        'email':                  student['email'],
        'xp':                     student.get('xp', 0),
        'level':                  student.get('level', 1),
        'badges':                 student.get('badges', []),
        'completedModulesCount':  len(completed_module_oids),
        'completedModules':       completed_modules_detail,
        'totalAttempts':          len(attempts),
        'attempts':               attempt_list
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Progress Summary for all assigned students
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.get('/students/progress')
@admin_required
def get_all_students_progress():
    """Aggregated progress for all students assigned to this instructor."""
    caller         = get_current_user()
    db             = get_db()
    instructor_oid = ObjectId(caller['uid'])

    filter_q = {'instructorId': instructor_oid} if caller.get('role') == 'admin' else {}
    progress_list = list(db.userProgress.find(
        filter_q,
        {'passwordHash': 0}
    ).sort([('xp', -1), ('level', -1)]))

    result = []
    for p in progress_list:
        result.append({
            'studentId':            str(p['studentId']),
            'name':                 p.get('name', ''),
            'xp':                   p.get('xp', 0),
            'level':                p.get('level', 1),
            'completedModulesCount': p.get('completedModulesCount', 0),
            'badges':               p.get('badges', []),
            'totalAttempts':        p.get('totalAttempts', 0),
            'lastActiveAt':         p.get('lastActiveAt', '').isoformat() + 'Z'
                                    if p.get('lastActiveAt') else None
        })

    return {'progress': result, 'total': len(result)}


# ─────────────────────────────────────────────────────────────────────────────
#  Global Leaderboard (visible to admins and super_admin)
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.get('/leaderboard/global')
@admin_required
def admin_global_leaderboard():
    db = get_db()
    entries = list(db.globalLeaderboard.find({}).sort('rank', 1).limit(100))
    result  = []
    for e in entries:
        result.append({
            'rank':                  e.get('rank'),
            'studentId':             str(e['studentId']),
            'studentName':           e.get('studentName', ''),
            'instructorId':          str(e['instructorId']) if e.get('instructorId') else None,
            'xp':                    e.get('xp', 0),
            'level':                 e.get('level', 1),
            'completedModulesCount': e.get('completedModulesCount', 0)
        })
    return {'leaderboard': result}


# ─────────────────────────────────────────────────────────────────────────────
#  Module CRUD
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.post('/module/create')
@admin_required
def create_module():
    caller = get_current_user()
    db     = get_db()
    data   = request.get_json(force=True)

    course_id = data.get('courseId')
    try:
        if course_id:
            ObjectId(course_id)
    except Exception:
        return {'error': 'Invalid Course ID format'}, 400

    module_no   = data.get('moduleNo')
    title       = data.get('title')
    context     = data.get('context')
    video_links = data.get('videoLinks', [])

    if not (course_id and module_no and title):
        return {'error': 'courseId, moduleNo and title are required'}, 400

    mod = {
        'courseId':   ObjectId(course_id),
        'moduleNo':   int(module_no),
        'title':      title,
        'context':    context or '',
        'videoLinks': video_links,
        'createdBy':  ObjectId(caller['uid']),
        'createdAt':  datetime.datetime.utcnow()
    }
    db.modules.insert_one(mod)
    return {'status': 'created'}


@admin_bp.put('/module/update/<module_id>')
@admin_required
def update_module(module_id):
    db   = get_db()
    data = request.get_json(force=True)

    update_data = {}
    if 'courseId'    in data: update_data['courseId']    = ObjectId(data['courseId'])
    if 'moduleNo'    in data: update_data['moduleNo']    = int(data['moduleNo'])
    if 'title'       in data: update_data['title']       = data['title']
    if 'context'     in data: update_data['context']     = data['context']
    if 'videoLinks'  in data: update_data['videoLinks']  = data['videoLinks']

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
@admin_required
def delete_module(module_id):
    db = get_db()
    result = db.modules.delete_one({'_id': ObjectId(module_id)})
    if result.deleted_count == 0:
        return {'error': 'Module not found'}, 404
    db.questions.delete_many({'moduleId': ObjectId(module_id)})
    return {'status': 'deleted'}


# ─────────────────────────────────────────────────────────────────────────────
#  Question CRUD
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.post('/question/create')
@admin_required
def create_question():
    db   = get_db()
    data = request.get_json(force=True)

    module_id  = data.get('moduleId')
    question   = data.get('question')
    options    = data.get('options')
    correct    = data.get('correctAnswer')
    difficulty = data.get('difficulty', 'easy')

    if not (module_id and question and options and correct is not None):
        return {'error': 'Missing fields'}, 400

    q = {
        'moduleId':      ObjectId(module_id),
        'question':      question,
        'options':       options,
        'correctAnswer': int(correct),
        'difficulty':    difficulty,
        'source':        'manual'
    }
    db.questions.insert_one(q)
    return {'status': 'created'}


@admin_bp.get('/module/<module_id>/questions')
@admin_required
def get_module_questions(module_id):
    db = get_db()
    questions = list(db.questions.find({'moduleId': ObjectId(module_id)}))
    for q in questions:
        q['_id']      = str(q['_id'])
        q['moduleId'] = str(q['moduleId'])
    return {'questions': questions}


@admin_bp.put('/question/update/<question_id>')
@admin_required
def update_question(question_id):
    db   = get_db()
    data = request.get_json(force=True)

    update_data = {}
    if 'question'      in data: update_data['question']      = data['question']
    if 'options'       in data: update_data['options']       = data['options']
    if 'correctAnswer' in data: update_data['correctAnswer'] = int(data['correctAnswer'])
    if 'difficulty'    in data: update_data['difficulty']    = data['difficulty']

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
@admin_required
def delete_question(question_id):
    db     = get_db()
    result = db.questions.delete_one({'_id': ObjectId(question_id)})
    if result.deleted_count == 0:
        return {'error': 'Question not found'}, 404
    return {'status': 'deleted'}


# ─────────────────────────────────────────────────────────────────────────────
#  PDF Upload / Module Generation
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.post('/pdf/upload')
@admin_required
def upload_pdf():
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400
    file      = request.files['file']
    pdf_bytes = file.read()
    text      = extract_text_from_pdf(pdf_bytes)
    generated = generate_mcqs_from_text(text, max_questions=10)
    return {'extractedText': text[:1000], 'generatedQuestions': generated}


@admin_bp.post('/pdf/generate-module')
@admin_required
def generate_module_from_pdf():
    caller = get_current_user()
    db     = get_db()

    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400

    file          = request.files['file']
    course_id     = request.form.get('courseId')
    module_title  = request.form.get('moduleTitle', 'Auto-Generated Module')
    num_questions = int(request.form.get('numQuestions', 10))

    if not course_id:
        return {'error': 'courseId is required'}, 400

    pdf_bytes = file.read()
    text      = extract_text_from_pdf(pdf_bytes)

    if not text or len(text) < 100:
        return {'error': 'Could not extract meaningful text from PDF'}, 400

    existing = list(
        db.modules.find({'courseId': ObjectId(course_id)}).sort('moduleNo', -1).limit(1)
    )
    next_module_no = (existing[0]['moduleNo'] + 1) if existing else 1

    module = {
        'courseId':        ObjectId(course_id),
        'moduleNo':        next_module_no,
        'title':           module_title,
        'context':         text[:2000],
        'videoLinks':      [],
        'createdBy':       ObjectId(caller['uid']),
        'createdAt':       datetime.datetime.utcnow(),
        'generatedFromPDF': True
    }
    module_result = db.modules.insert_one(module)
    module_id     = module_result.inserted_id

    generated_questions = generate_mcqs_from_text(text, max_questions=num_questions)
    questions_inserted  = []
    for q_data in generated_questions:
        q = {
            'moduleId':        module_id,
            'question':        q_data['question'],
            'options':         q_data['options'],
            'correctAnswer':   q_data['correctAnswer'],
            'difficulty':      q_data.get('difficulty', 'medium'),
            'source':          'pdf',
            'generatedFromPDF': True
        }
        r = db.questions.insert_one(q)
        questions_inserted.append(str(r.inserted_id))

    return {
        'success':             True,
        'moduleId':            str(module_id),
        'moduleNo':            next_module_no,
        'moduleTitle':         module_title,
        'questionsCreated':    len(questions_inserted),
        'extractedTextLength': len(text)
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Contest CRUD
# ─────────────────────────────────────────────────────────────────────────────
@admin_bp.post('/contest/create')
@admin_required
def create_contest():
    caller = get_current_user()
    db     = get_db()
    data   = request.get_json(force=True)

    title = data.get('title')
    if not title:
        return {'error': 'title is required'}, 400

    try:
        module_ids = [ObjectId(m) for m in data.get('moduleIds', [])]
    except Exception:
        return {'error': 'Invalid Module ID in list'}, 400

    contest = {
        'title':          title,
        'moduleIds':      module_ids,
        'startTime':      data.get('startTime'),
        'endTime':        data.get('endTime'),
        'durationMinutes': int(data.get('durationMinutes', 30)),
        'marksPerQuestion': int(data.get('marksPerQuestion', 1)),
        'negativeMarking': float(data.get('negativeMarking', 0)),
        'tieBreak':       data.get('tieBreak', 'time'),
        'createdBy':      ObjectId(caller['uid']),
        'createdAt':      datetime.datetime.utcnow(),
        'visibleToAll':   bool(data.get('visibleToAll', True))
    }
    result     = db.contests.insert_one(contest)
    contest_id = result.inserted_id

    # Insert custom questions if any
    for q_data in data.get('customQuestions', []):
        db.questions.insert_one({
            'contestId':     contest_id,
            'question':      q_data['question'],
            'options':       q_data['options'],
            'correctAnswer': int(q_data['correctAnswer']),
            'difficulty':    'medium',
            'source':        'custom_contest'
        })

    return {'status': 'created', 'contestId': str(contest_id)}, 201


@admin_bp.put('/contest/update/<contest_id>')
@admin_required
def update_contest(contest_id):
    db   = get_db()
    data = request.get_json(force=True)

    update_data = {}
    if 'title'           in data: update_data['title']           = data['title']
    if 'moduleIds'       in data: update_data['moduleIds']       = [ObjectId(m) for m in data['moduleIds']]
    if 'startTime'       in data: update_data['startTime']       = data['startTime']
    if 'endTime'         in data: update_data['endTime']         = data['endTime']
    if 'durationMinutes' in data: update_data['durationMinutes'] = int(data['durationMinutes'])
    if 'marksPerQuestion'in data: update_data['marksPerQuestion']= int(data['marksPerQuestion'])
    if 'negativeMarking' in data: update_data['negativeMarking'] = float(data['negativeMarking'])
    if 'tieBreak'        in data: update_data['tieBreak']        = data['tieBreak']
    if 'visibleToAll'    in data: update_data['visibleToAll']    = bool(data['visibleToAll'])

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
@admin_required
def delete_contest(contest_id):
    db = get_db()
    result = db.contests.delete_one({'_id': ObjectId(contest_id)})
    if result.deleted_count == 0:
        return {'error': 'Contest not found'}, 404
    db.contestLeaderboard.delete_many({'contestId': ObjectId(contest_id)})
    return {'status': 'deleted'}
