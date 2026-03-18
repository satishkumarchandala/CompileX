import sys, os
sys.path.append(os.getcwd())
import json
from src.db import get_db
from app import create_app
from bson import ObjectId
from src.routes.superadmin_routes import _serialize_user
import datetime

app = create_app()

def check_serializable(obj, path="root"):
    try:
        json.dumps(obj)
    except TypeError as e:
        if isinstance(obj, dict):
            for k, v in obj.items():
                check_serializable(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                check_serializable(v, f"{path}[{i}]")
        else:
            print(f"NOT SERIALIZABLE at {path}: {type(obj)} {obj}")

with app.app_context():
    db = get_db()
    for role in ['admin', 'student']:
        print(f"\nChecking {role}s:")
        users = list(db.users.find({'role': role}, {'passwordHash': 0}))
        for u in users:
            u_serialized = _serialize_user(u)
            check_serializable(u_serialized)
