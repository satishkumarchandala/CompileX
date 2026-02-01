"""
Script to remove duplicate modules from the database
"""
from pymongo import MongoClient
from collections import defaultdict

def remove_duplicate_modules():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['compiler_gamified']
    modules_collection = db['modules']
    
    # Find all modules
    all_modules = list(modules_collection.find())
    print(f"Total modules found: {len(all_modules)}")
    
    # Group by courseId and moduleNo to find duplicates
    module_groups = defaultdict(list)
    for module in all_modules:
        key = (str(module['courseId']), module['moduleNo'], module['title'])
        module_groups[key].append(module)
    
    # Find and remove duplicates
    duplicates_removed = 0
    for key, modules in module_groups.items():
        if len(modules) > 1:
            print(f"\nFound {len(modules)} duplicates for: {key[2]} (Module {key[1]})")
            # Keep the first one, delete the rest
            for module in modules[1:]:
                print(f"  Deleting duplicate: {module['_id']}")
                modules_collection.delete_one({'_id': module['_id']})
                duplicates_removed += 1
    
    print(f"\n✅ Total duplicates removed: {duplicates_removed}")
    
    # Show final count
    final_count = modules_collection.count_documents({})
    print(f"✅ Final module count: {final_count}")
    
    # List remaining modules
    print("\nRemaining modules:")
    for module in modules_collection.find().sort('moduleNo', 1):
        print(f"  Module {module['moduleNo']}: {module['title']}")
    
    client.close()

if __name__ == '__main__':
    remove_duplicate_modules()
