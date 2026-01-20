#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.models import DailyAnalytics, BikeStation

total = DailyAnalytics.objects.count()
ghosts = DailyAnalytics.objects.filter(is_ghost=True).count()
print(f"Total DailyAnalytics records: {total}")
print(f"Ghost analytics records: {ghosts}")

station_ghosts = BikeStation.objects.filter(profile='ghost_station').count()
print(f"BikeStation with ghost profile: {station_ghosts}")

# Show sample ghost stations
print("\nSample ghost stations from BikeStation:")
for s in BikeStation.objects.filter(profile='ghost_station')[:5]:
    print(f"  - {s.name} (ID: {s.id})")

# Check if ghost stations have analytics
print("\nGhost stations in DailyAnalytics (sample):")
for record in DailyAnalytics.objects.filter(is_ghost=True)[:5]:
    print(f"  - {record.station.name} (CV: {record.shannon_entropy}, Util: {record.average_utilization})")
