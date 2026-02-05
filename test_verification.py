import requests

response = requests.get('http://localhost:8000/api/stations/?limit=10')
data = response.json()

print('=== API VERIFICATION ===')
print(f'Total stations: {data["count"]}')
print(f'Returned: {len(data["results"])}')
print()
print('Sample stations with coordinates:')
for i, s in enumerate(data['results'][:5], 1):
    print(f'{i}. {s["name"]}: ({s["latitude"]}, {s["longitude"]})')
