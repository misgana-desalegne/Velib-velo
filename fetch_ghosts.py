import requests

url = 'http://localhost:8000/api/analytics/?limit=1000'
all_results = []
page = 1

while url:
    print(f'Fetching page {page}...')
    resp = requests.get(url)
    data = resp.json()
    all_results.extend(data.get('results', []))
    url = data.get('next')
    page += 1

ghost_count = sum(1 for r in all_results if r.get('is_ghost'))
print(f'\nTotal analytics fetched: {len(all_results)}')
print(f'Ghost stations in all results: {ghost_count}')
print(f'\nFirst 3 ghosts:')
for item in [r for r in all_results if r.get('is_ghost')][:3]:
    print(f'  {item.get("station_name")}: is_ghost={item.get("is_ghost")}, station_id={item.get("station")}')
