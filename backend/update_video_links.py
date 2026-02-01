"""
Script to update existing modules with YouTube video links
"""
from pymongo import MongoClient
from bson import ObjectId

def update_module_videos():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['compiler_gamified']
    modules_collection = db['modules']
    
    # YouTube video links for compiler design topics
    video_links = {
        1: ['https://www.youtube.com/watch?v=UwFsS33xu0Q'],  # Lexical Analysis
        2: ['https://www.youtube.com/watch?v=Qkdc6K3VPBs'],  # Syntax Analysis  
        3: ['https://www.youtube.com/watch?v=_CJN1qpLv-k'],  # Semantic Analysis
        4: ['https://www.youtube.com/watch?v=1GSjbWt0c9M'],  # Intermediate Code
        5: ['https://www.youtube.com/watch?v=FnGCDLhaxKU']   # Code Optimization
    }
    
    updated_count = 0
    
    for module_no, video_urls in video_links.items():
        result = modules_collection.update_many(
            {'moduleNo': module_no},
            {'$set': {'videoLinks': video_urls}}
        )
        updated_count += result.modified_count
        print(f"Module {module_no}: Updated {result.modified_count} document(s)")
    
    print(f"\n✅ Total modules updated: {updated_count}")
    
    # Verify updates
    print("\n📋 Current video links:")
    for module in modules_collection.find().sort('moduleNo', 1):
        print(f"  Module {module['moduleNo']}: {len(module.get('videoLinks', []))} video(s)")
        for i, link in enumerate(module.get('videoLinks', []), 1):
            print(f"    - Video {i}: {link}")
    
    client.close()

if __name__ == '__main__':
    update_module_videos()
