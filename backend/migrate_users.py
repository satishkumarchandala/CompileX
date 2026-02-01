"""
Migration script to add completedModules field to existing users
Run this once to ensure all users have the completedModules array
"""
from pymongo import MongoClient

def migrate_users():
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['compiler_gamified']
    users_collection = db['users']
    
    # Find all users without completedModules field
    users_without_field = users_collection.count_documents({'completedModules': {'$exists': False}})
    
    print(f"Found {users_without_field} users without completedModules field")
    
    if users_without_field > 0:
        # Add completedModules: [] to all users who don't have it
        result = users_collection.update_many(
            {'completedModules': {'$exists': False}},
            {'$set': {'completedModules': []}}
        )
        
        print(f"Successfully migrated {result.modified_count} users")
    else:
        print("All users already have completedModules field")
    
    # Verify migration
    total_users = users_collection.count_documents({})
    users_with_field = users_collection.count_documents({'completedModules': {'$exists': True}})
    
    print(f"\nMigration complete:")
    print(f"Total users: {total_users}")
    print(f"Users with completedModules field: {users_with_field}")
    
    client.close()

if __name__ == '__main__':
    migrate_users()
