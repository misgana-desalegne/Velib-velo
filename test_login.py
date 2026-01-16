import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from django.test import Client
import json

client = Client()

# Test the login endpoint
print("Testing login endpoint...")
try:
    response = client.post(
        '/api/auth/login/',
        {
            'email': 'test@example.com',
            'password': 'testpass'
        },
        content_type='application/json'
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.content.decode()[:500]}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
