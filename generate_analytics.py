import os
import django
from datetime import datetime
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.models import BikeStation
import random

print('Generating sample analytics data for testing...')

today = datetime.now().date()

# Get all stations
stations = list(BikeStation.objects.values('id', 'commune_id', 'profile'))
total = len(stations)

# Clear old data for today
with connection.cursor() as cursor:
    cursor.execute("DELETE FROM analytics_dailyanalytics WHERE date = %s", [today])
    print(f'Cleared old data')

# Insert new data
values = []
for station in stations:
    entropy = round(random.uniform(2.0, 7.5), 2)
    flux = round(random.uniform(-15, 15), 2)
    
    values.append((
        today,  # date
        random.randint(5, 100),  # total_trips
        random.randint(10, 120),  # total_duration_minutes
        round(random.uniform(5, 30), 2),  # average_duration_minutes
        round(random.uniform(0.1, 0.95), 2),  # average_utilization
        random.randint(8, 18),  # peak_hour
        station['id'],  # station_id
        round(random.uniform(-5, 5), 2),  # average_hourly_delta
        1 if station['profile'] == 'ghost_station' else 0,  # is_ghost
        1 if station['profile'] == 'commuter_sink' else 0,  # is_sink
        1 if station['profile'] == 'commuter_source' else 0,  # is_source
        flux,  # net_flux
        random.randint(0, 8),  # persistence_at_empty
        random.randint(0, 8),  # persistence_at_full
        entropy,  # shannon_entropy
        station['commune_id'],  # commune_id
    ))

# Insert all at once
sql = """
INSERT INTO analytics_dailyanalytics 
(date, total_trips, total_duration_minutes, average_duration_minutes, average_utilization, peak_hour, 
station_id, average_hourly_delta, is_ghost, is_sink, is_source, net_flux, persistence_at_empty, 
persistence_at_full, shannon_entropy, commune_id)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

with connection.cursor() as cursor:
    cursor.executemany(sql, values)

print(f'\nGenerated analytics data:')
print(f'  Total stations: {total}')
print(f'  Created: {total}')

# Verify ghost stations have analytics
from apps.analytics.models import DailyAnalytics
ghost_analytics = DailyAnalytics.objects.filter(date=today, is_ghost=True).count()
print(f'\nGhost stations with analytics: {ghost_analytics}')

# Show some examples
print(f'\nSample ghost stations:')
samples = DailyAnalytics.objects.filter(date=today, is_ghost=True)[:3]
for sample in samples:
    print(f'  - {sample.station.name}')
    print(f'    Entropy: {sample.shannon_entropy:.2f} bits')
    print(f'    Flux: {sample.net_flux:.2f} v/h')
