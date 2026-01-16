import os
import django
from django.db import models

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.models import DailyAnalytics
from datetime import datetime

today = datetime.now().date()

# Check total analytics
total = DailyAnalytics.objects.filter(date=today).count()
print(f'Total analytics records for today: {total}')

# Check ghost stations
ghosts = DailyAnalytics.objects.filter(date=today, is_ghost=True).count()
print(f'Ghost stations: {ghosts}')

# Check high entropy stations
high_entropy = DailyAnalytics.objects.filter(date=today, shannon_entropy__gt=6).count()
print(f'High entropy (>6): {high_entropy}')

# Check high flux stations
high_flux = DailyAnalytics.objects.filter(date=today).filter(
    models.Q(net_flux__gt=10) | models.Q(net_flux__lt=-10)
).count()
print(f'High flux volatility: {high_flux}')

# Show critical alerts candidates
print(f'\nCritical alert candidates:')
print(f'  Ghost stations: {ghosts}')
print(f'  High entropy: {high_entropy}')
print(f'  Total potential alerts: {ghosts + high_entropy} (may overlap)')

# Show some sample ghost stations with their metrics
print(f'\nSample ghost stations:')
samples = DailyAnalytics.objects.filter(date=today, is_ghost=True)[:3]
for sample in samples:
    print(f'  - {sample.station.name}')
    print(f'    Entropy: {float(sample.shannon_entropy):.2f} bits (critical if >6)')
    print(f'    Flux: {float(sample.net_flux):.2f} v/h')
