from flask import Blueprint
from src.db import get_db

course_bp = Blueprint('course', __name__)


@course_bp.get('/courses')
def get_courses():
    db = get_db()
    courses = list(db.courses.find({}, {'title': 1, 'description': 1, 'modules': 1}))
    for c in courses:
        c['_id'] = str(c['_id'])
    return {'courses': courses}


@course_bp.get('/modules')
def get_all_modules():
    db = get_db()
    modules = list(db.modules.find({}))
    for m in modules:
        m['_id'] = str(m['_id'])
        m['courseId'] = str(m['courseId'])
    return {'modules': modules}


@course_bp.get('/modules/<module_id>')
def get_module(module_id):
    from bson import ObjectId
    db = get_db()
    m = db.modules.find_one({'_id': ObjectId(module_id)})
    if not m:
        return {'error': 'Module not found'}, 404
    m['_id'] = str(m['_id'])
    m['courseId'] = str(m['courseId'])
    return m
