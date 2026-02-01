#!/usr/bin/env python3
"""
End-to-End System Validation Script
Tests connectivity between Backend, Web Frontend, and Mobile App
"""

import requests
import sys
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json

load_dotenv('backend/.env')

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{text.center(60)}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def test_mongodb():
    """Test MongoDB connection"""
    print_header("Testing MongoDB Connection")
    uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('MONGODB_DB', 'compiler_gamified')
    
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        db = client[db_name]
        
        # Check collections
        collections = db.list_collection_names()
        print_success(f"Connected to MongoDB: {db_name}")
        print(f"   Collections found: {len(collections)}")
        
        # Check data
        user_count = db.users.count_documents({})
        module_count = db.modules.count_documents({})
        question_count = db.questions.count_documents({})
        
        print(f"   Users: {user_count}")
        print(f"   Modules: {module_count}")
        print(f"   Questions: {question_count}")
        
        if module_count == 0:
            print_warning("No modules found. Run seed script to populate data.")
        
        return True
    except Exception as e:
        print_error(f"MongoDB connection failed: {e}")
        return False

def test_backend():
    """Test Backend API"""
    print_header("Testing Backend API")
    base_url = 'http://localhost:5000'
    
    try:
        # Test health endpoint
        r = requests.get(f'{base_url}/api/health', timeout=5)
        if r.status_code == 200:
            print_success("Backend health check passed")
        else:
            print_error(f"Health check returned status {r.status_code}")
            return False
        
        # Test modules endpoint
        r = requests.get(f'{base_url}/api/modules', timeout=5)
        if r.status_code == 200:
            modules = r.json().get('modules', [])
            print_success(f"Modules endpoint working ({len(modules)} modules)")
        else:
            print_error("Modules endpoint failed")
            return False
        
        # Test contests endpoint
        r = requests.get(f'{base_url}/api/contests', timeout=5)
        if r.status_code == 200:
            contests = r.json().get('contests', [])
            print_success(f"Contests endpoint working ({len(contests)} contests)")
        else:
            print_error("Contests endpoint failed")
            return False
        
        return True
    except requests.exceptions.ConnectionError:
        print_error("Backend is not running at http://localhost:5000")
        print_warning("Start backend with: cd backend && python app.py")
        return False
    except Exception as e:
        print_error(f"Backend test failed: {e}")
        return False

def test_web_frontend():
    """Test Web Frontend"""
    print_header("Testing Web Frontend")
    
    try:
        r = requests.get('http://localhost:5173', timeout=5)
        if r.status_code == 200:
            print_success("Web frontend is running")
            return True
        else:
            print_error(f"Web frontend returned status {r.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_warning("Web frontend is not running at http://localhost:5173")
        print_warning("Start with: cd frontend && npm run dev")
        return False
    except Exception as e:
        print_error(f"Web frontend test failed: {e}")
        return False

def test_mobile_config():
    """Test Mobile App Configuration"""
    print_header("Testing Mobile App Configuration")
    
    mobile_api_file = 'mobile/src/api/client.js'
    
    if not os.path.exists(mobile_api_file):
        print_error(f"Mobile app not found at {mobile_api_file}")
        return False
    
    try:
        with open(mobile_api_file, 'r') as f:
            content = f.read()
            
        if 'BASE_URL' in content:
            print_success("Mobile API client file exists")
            
            # Check for common configurations
            if '10.0.2.2' in content:
                print("   Configured for: Android Emulator")
            elif 'localhost' in content:
                print("   Configured for: iOS Simulator")
            else:
                print("   Configured for: Physical Device")
            
            print_warning("Remember to update BASE_URL for your setup!")
            return True
        else:
            print_error("BASE_URL not found in mobile API client")
            return False
    except Exception as e:
        print_error(f"Mobile config test failed: {e}")
        return False

def test_authentication_flow():
    """Test complete authentication flow"""
    print_header("Testing Authentication Flow")
    base_url = 'http://localhost:5000'
    
    try:
        # Test registration
        test_user = {
            'name': 'Test User',
            'email': f'test_{os.urandom(4).hex()}@test.com',
            'password': 'test123',
            'role': 'student'
        }
        
        r = requests.post(f'{base_url}/api/auth/register', json=test_user, timeout=5)
        if r.status_code == 200:
            data = r.json()
            token = data.get('token')
            print_success("Registration endpoint working")
            
            # Test login
            r = requests.post(f'{base_url}/api/auth/login', json={
                'email': test_user['email'],
                'password': test_user['password']
            }, timeout=5)
            
            if r.status_code == 200:
                print_success("Login endpoint working")
                
                # Test authenticated endpoint
                headers = {'Authorization': f'Bearer {token}'}
                r = requests.get(f'{base_url}/api/modules', headers=headers, timeout=5)
                
                if r.status_code == 200:
                    print_success("JWT authentication working")
                    return True
                else:
                    print_error("Authenticated request failed")
                    return False
            else:
                print_error("Login failed")
                return False
        else:
            print_error(f"Registration failed: {r.json().get('error', 'Unknown error')}")
            return False
    except Exception as e:
        print_error(f"Authentication test failed: {e}")
        return False

def generate_report(results):
    """Generate final report"""
    print_header("System Validation Report")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    print()
    
    for test_name, result in results.items():
        status = f"{Colors.GREEN}PASS{Colors.END}" if result else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {test_name}: {status}")
    
    print()
    
    if passed == total:
        print_success("🎉 ALL SYSTEMS OPERATIONAL!")
        print()
        print("Next Steps:")
        print("  1. Web App: http://localhost:5173")
        print("  2. Mobile App: cd mobile && npm start")
        print("  3. API Docs: See COMPLETE_DOCUMENTATION.md")
        return 0
    else:
        print_error("⚠️  SOME SYSTEMS NEED ATTENTION")
        print()
        print("Troubleshooting:")
        if not results.get('MongoDB'):
            print("  - Start MongoDB service")
        if not results.get('Backend'):
            print("  - cd backend && python app.py")
        if not results.get('Web Frontend'):
            print("  - cd frontend && npm run dev")
        return 1

def main():
    print_header("Compiler Learning Platform - System Validation")
    print("This script will test all components of your system.\n")
    
    results = {}
    
    # Run all tests
    results['MongoDB'] = test_mongodb()
    results['Backend'] = test_backend()
    results['Web Frontend'] = test_web_frontend()
    results['Mobile Config'] = test_mobile_config()
    
    if results['Backend']:
        results['Authentication'] = test_authentication_flow()
    else:
        results['Authentication'] = False
        print_warning("Skipping authentication test (backend not running)")
    
    # Generate report
    exit_code = generate_report(results)
    sys.exit(exit_code)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.END}")
        sys.exit(1)
