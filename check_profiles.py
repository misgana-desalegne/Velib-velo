import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.models import BikeStation
from django.db.models import Count

profiles = BikeStation.objects.values('profile').annotate(count=Count('id')).order_by('-count')
print('Station profiles:')
for p in profiles:
    print(f"  {p['profile']}: {p['count']}")

# Check ghost stations
ghost_count = BikeStation.objects.filter(profile='ghost_station').count()
print(f'\nGhost Stations: {ghost_count}')
