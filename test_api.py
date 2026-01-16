import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from django.test import Client
import json

client = Client()

# Test the analytics endpoint
response = client.get('/api/analytics/?limit=5')
if response.status_code == 200:
    data = json.loads(response.content)
    print(f'Analytics endpoint working: {response.status_code}')
    print(f'Total records available: {data.get("count", 0)}')
    
    if data.get('results'):
        print(f'\nFirst 3 records:')
        for record in data['results'][:3]:
            print(f'  Station ID: {record.get("station")}')
            print(f'    Entropy: {record.get("shannon_entropy")}')
            print(f'    Flux: {record.get("net_flux")}')
            print(f'    Is Ghost: {record.get("is_ghost")}')
else:
    print(f'Error: {response.status_code}')

# Test how many ghost stations are in analytics
response = client.get('/api/analytics/?is_ghost=true')
if response.status_code == 200:
    data = json.loads(response.content)
    print(f'\nGhost stations in analytics: {data.get("count", 0)}')
else:
    print(f'Filter not working: {response.status_code}')
