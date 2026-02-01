from src.db import get_db


def seed_initial_data():
    db = get_db()
    # Seed course
    course = db.courses.find_one({'title': 'Compiler Design'})
    if not course:
        db.courses.insert_one({
            'title': 'Compiler Design',
            'description': 'Learn compiler design via gamified modules.',
            'modules': [1, 2, 3, 4, 5]
        })
        course = db.courses.find_one({'title': 'Compiler Design'})
    # Seed modules if missing
    titles = {
        1: 'Lexical Analysis',
        2: 'Syntax Analysis',
        3: 'Semantic Analysis',
        4: 'Intermediate Code Generation',
        5: 'Code Optimization & Code Generation'
    }
    
    # Sample YouTube video links for compiler design topics
    video_links = {
        1: ['https://www.youtube.com/watch?v=UwFsS33xu0Q'],  # Lexical Analysis
        2: ['https://www.youtube.com/watch?v=Qkdc6K3VPBs'],  # Syntax Analysis
        3: ['https://www.youtube.com/watch?v=_CJN1qpLv-k'],  # Semantic Analysis
        4: ['https://www.youtube.com/watch?v=1GSjbWt0c9M'],  # Intermediate Code
        5: ['https://www.youtube.com/watch?v=FnGCDLhaxKU']   # Code Optimization
    }
    
    for mno, title in titles.items():
        exists = db.modules.find_one({'courseId': course['_id'], 'moduleNo': mno})
        if not exists:
            db.modules.insert_one({
                'courseId': course['_id'],
                'moduleNo': mno,
                'title': title,
                'context': f'Notes for {title}.',
                'videoLinks': video_links.get(mno, [])
            })
