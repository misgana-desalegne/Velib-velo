import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.models import DailyAnalytics, BikeStation

# Get ghost stations
ghosts = DailyAnalytics.objects.filter(is_ghost=True)[:5]
print(f"Total ghost analytics: {DailyAnalytics.objects.filter(is_ghost=True).count()}")
print(f"\nFirst 5 ghost stations:")

for ghost in ghosts:
    station = BikeStation.objects.get(id=ghost.station_id)
    cv = float(ghost.shannon_entropy or 0)
    utilization = float(ghost.average_utilization or 0)
    flux = float(ghost.net_flux or 0)
    
    print(f"\n  Station: {station.name} (ID={station.id})")
    print(f"    Profile: {station.profile}")
    print(f"    is_ghost: {ghost.is_ghost}")
    print(f"    CV: {cv:.2f}%")
    print(f"    Utilization: {utilization:.2%}")
    print(f"    Flux: {flux:.2f} v/h")
    print(f"    Bikes: mech={station.mechanical} + ebike={station.ebike} = {station.mechanical + station.ebike}")
    print(f"    Capacity: {station.capacity}")

print("\n\nNon-ghost stations with low CV:")
low_cv = DailyAnalytics.objects.filter(is_ghost=False, shannon_entropy__lt=5)[:3]
for item in low_cv:
    station = BikeStation.objects.get(id=item.station_id)
    cv = float(item.shannon_entropy or 0)
    utilization = float(item.average_utilization or 0)
    print(f"  {station.name}: CV={cv:.2f}%, Util={utilization:.2%}")
