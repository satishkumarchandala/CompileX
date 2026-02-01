import requests
import socket

def test_backend_connection():
    print("🔍 Testing Backend Connectivity...\n")
    
    # Get local IP
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"✅ Computer Hostname: {hostname}")
    print(f"✅ Local IP Address: {local_ip}\n")
    
    # Test localhost
    print("Testing localhost...")
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        print(f"✅ Localhost works! Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Localhost failed: {e}")
    
    # Test 127.0.0.1
    print("\nTesting 127.0.0.1...")
    try:
        response = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
        print(f"✅ 127.0.0.1 works! Status: {response.status_code}")
    except Exception as e:
        print(f"❌ 127.0.0.1 failed: {e}")
    
    # Test network IP
    print(f"\nTesting network IP ({local_ip})...")
    try:
        response = requests.get(f'http://{local_ip}:5000/api/health', timeout=5)
        print(f"✅ Network IP works! Status: {response.status_code}")
        print(f"✅ Mobile devices should use: http://{local_ip}:5000/api")
    except Exception as e:
        print(f"❌ Network IP failed: {e}")
        print("⚠️  This might be a firewall issue!")
    
    # Test specific IP
    test_ip = "172.30.86.64"
    print(f"\nTesting specific IP ({test_ip})...")
    try:
        response = requests.get(f'http://{test_ip}:5000/api/health', timeout=5)
        print(f"✅ {test_ip} works! Status: {response.status_code}")
    except Exception as e:
        print(f"❌ {test_ip} failed: {e}")
    
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Use this URL in your mobile app:")
    print(f"http://{local_ip}:5000/api")
    print("\nIf network IP test failed:")
    print("1. Check Windows Firewall settings")
    print("2. Ensure both devices on same WiFi")
    print("3. Try disabling firewall temporarily for testing")

if __name__ == '__main__':
    test_backend_connection()
