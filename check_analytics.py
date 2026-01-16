import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.models import DailyAnalytics, BikeStation
from django.db.models import Count

today = datetime.now().date()
print(f'Checking analytics for: {today}')

# Check total analytics records
total_analytics = DailyAnalytics.objects.all().count()
today_analytics = DailyAnalytics.objects.filter(date=today).count()

print(f'\nTotal DailyAnalytics records: {total_analytics}')
print(f'Analytics for today ({today}): {today_analytics}')

if today_analytics > 0:
    # Check if any analytics records have entropy data
    with_entropy = DailyAnalytics.objects.filter(date=today, shannon_entropy__isnull=False).count()
    with_flux = DailyAnalytics.objects.filter(date=today, net_flux__isnull=False).count()
    
    print(f'  - With entropy data: {with_entropy}')
    print(f'  - With flux data: {with_flux}')
    
    # Check if ghost stations have analytics
    ghost_stations = BikeStation.objects.filter(profile='ghost_station')
    ghost_with_analytics = DailyAnalytics.objects.filter(date=today, station__in=ghost_stations).count()
    print(f'  - Ghost stations with analytics: {ghost_with_analytics} / 76')
    
    # Show a sample ghost station with analytics
    sample = DailyAnalytics.objects.filter(date=today, station__profile='ghost_station').first()
    if sample:
        print(f'\nSample ghost station analytics:')
        print(f'  Station: {sample.station.name}')
        print(f'  Date: {sample.date}')
        print(f'  Entropy: {sample.shannon_entropy}')
        print(f'  Flux: {sample.net_flux}')
        print(f'  Is Ghost: {sample.is_ghost}')
else:
    print('\nNo analytics data for today!')
    print('Check if the ETL scheduler is running and has populated today\'s data.')
    
    # Check most recent data
    latest = DailyAnalytics.objects.order_by('-date').first()
    if latest:
        print(f'\nMost recent analytics data is from: {latest.date}')
