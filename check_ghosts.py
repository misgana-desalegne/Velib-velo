import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.models import BikeStation
from django.db.models import Count

ghost_count = BikeStation.objects.filter(profile='ghost_station').count()
total_count = BikeStation.objects.count()
profile_null = BikeStation.objects.filter(profile__isnull=True).count()
profile_unknown = BikeStation.objects.filter(profile='unknown').count()

print(f'Total stations: {total_count}')
print(f'Ghost stations: {ghost_count}')
print(f'Null profiles: {profile_null}')
print(f'Unknown profiles: {profile_unknown}')

print('\nProfile distribution:')
profiles = BikeStation.objects.values('profile').annotate(count=Count('id')).order_by('profile')
for p in profiles:
    print(f"  {p['profile']}: {p['count']}")

if ghost_count > 0:
    print(f'\nFirst 3 ghost stations:')
    ghosts = BikeStation.objects.filter(profile='ghost_station')[:3]
    for g in ghosts:
        print(f'  - {g.name} (ID: {g.id})')
else:
    print('\nNo ghost stations found in database!')
    print('Ghost stations need to be profiled first.')
