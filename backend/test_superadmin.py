import os, sys
from app import create_app
from src.db import get_db

app = create_app()
app.config['TESTING'] = True
client = app.test_client()

with app.app_context():
    db = get_db()
    superadmin = db.users.find_one({'role': 'super_admin'})
    if not superadmin:
        print('No superadmin found!')
        sys.exit(1)
    
    from src.auth import create_token
    token = create_token(str(superadmin['_id']), 'super_admin')
    headers = {'Authorization': f'Bearer {token}'}

    print('--- /api/superadmin/stats ---')
    r1 = client.get('/api/superadmin/stats', headers=headers)
    print(r1.status_code)
    try:
        print(r1.get_json())
    except:
        print(r1.data)

    print('--- /api/superadmin/admins ---')
    r2 = client.get('/api/superadmin/admins', headers=headers)
    print(r2.status_code)
    try:
        print(r2.get_json())
    except:
        print(r2.data)

    print('--- /api/superadmin/students ---')
    r3 = client.get('/api/superadmin/students', headers=headers)
    print(r3.status_code)
    try:
        print(r3.get_json())
    except:
        print(r3.data)
