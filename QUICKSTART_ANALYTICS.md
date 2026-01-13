# Quick Start Guide - Advanced Analytics

## Installation & Setup

### Step 1: Run Migrations
```bash
python manage.py migrate
```

### Step 2: Calculate Analytics for Historical Data
```bash
# Calculate for last 15 days
python manage.py calculate_advanced_analytics --days 15

# Or for a specific date range
python manage.py calculate_advanced_analytics --start-date 2025-01-01 --end-date 2025-01-15
```

## Using the Analytics Service

### From Django Shell
```bash
python manage.py shell
```

```python
from apps.analytics.services.advanced_analytics_service import AdvancedAnalyticsService
from apps.analytics.models import BikeStation
from datetime import date

# Get top 10 SOURCE stations (suppliers)
results = AdvancedAnalyticsService.get_top_sources_and_sinks(days=15, limit=10)
print("Top Sources:")
for source in results['sources']:
    print(f"  {source['station__name']}: {source['avg_net_flux']:.2f} bikes/day")

# Get Ghost Stations (relocation candidates)
ghosts = AdvancedAnalyticsService.get_ghost_stations(days=15, limit=10)
print("Ghost Stations:")
for ghost in ghosts:
    print(f"  {ghost['station__name']}: entropy={ghost['avg_entropy']:.2f}")

# Calculate for a specific station
station = BikeStation.objects.get(station_id='16001')
analytics = AdvancedAnalyticsService.calculate_daily_analytics(station, date(2025, 1, 15))
print(f"Profile: {analytics['profile']}")
print(f"Entropy: {analytics['shannon_entropy']}")
print(f"Net Flux: {analytics['net_flux']}")
```

## API Endpoints

### Get Daily Analytics
```
GET /api/analytics/
```

Query parameters:
- `is_source=true` - Only SOURCE stations
- `is_sink=true` - Only SINK stations
- `is_ghost=true` - Only GHOST stations
- `date=2025-01-15` - Specific date

Response:
```json
{
  "count": 100,
  "results": [
    {
      "id": 1,
      "date": "2025-01-15",
      "station_id": "16001",
      "station_name": "Dumont d'Urville - Jaures",
      "shannon_entropy": "3.45",
      "net_flux": "-23.50",
      "is_source": false,
      "is_sink": true,
      "is_ghost": false,
      "average_utilization": "68.50",
      "persistence_at_full": 2,
      "persistence_at_empty": 8
    }
  ]
}
```

## Common Queries

### Find stations that need capacity expansion
```python
from django.db.models import Avg
from apps.analytics.models import DailyAnalytics

expansion_candidates = DailyAnalytics.objects.filter(
    is_source=True,
    persistence_at_full__gte=10
).values('station__station_id', 'station__name').annotate(
    avg_full_hours=Avg('persistence_at_full'),
    avg_flux=Avg('net_flux')
).order_by('-avg_full_hours')[:10]

for candidate in expansion_candidates:
    print(f"{candidate['station__name']}: {candidate['avg_full_hours']:.1f} hours full")
```

### Find stations that need rebalancing
```python
rebalancing_candidates = DailyAnalytics.objects.filter(
    is_sink=True,
    persistence_at_empty__gte=10
).values('station__station_id', 'station__name').annotate(
    avg_empty_hours=Avg('persistence_at_empty'),
    avg_flux=Avg('net_flux')
).order_by('-avg_empty_hours')[:10]

for candidate in rebalancing_candidates:
    print(f"{candidate['station__name']}: {candidate['avg_empty_hours']:.1f} hours empty")
```

### Find ghost stations
```python
ghost_stations = DailyAnalytics.objects.filter(
    is_ghost=True
).values('station__station_id', 'station__name').annotate(
    occurrences=models.Count('id'),
    avg_entropy=Avg('shannon_entropy')
).filter(occurrences__gte=5).order_by('-occurrences')[:10]

for ghost in ghost_stations:
    print(f"{ghost['station__name']}: ghost {ghost['occurrences']} days")
```

## Interpreting the Metrics

| Metric | Low Value | High Value | Action |
|--------|-----------|-----------|--------|
| **Entropy** | Predictable (stale) | Unpredictable (dynamic) | High entropy = healthy |
| **Net Flux** | Negative (sink) | Positive (source) | Use flux direction to classify |
| **Persistence at Full** | Good | Bad | Indicates capacity shortage |
| **Persistence at Empty** | Good | Bad | Indicates bike shortage |

## Troubleshooting

### "No analytics data for this period"
- Run the management command to calculate analytics
- Check that station status data exists for the date range

### "All stations showing as 'unknown' profile"
- This is normal - profiles are only assigned after first calculation
- Run management command to classify stations

### Performance is slow
- Make sure you're using `.select_related()` and `.prefetch_related()`
- Consider calculating analytics in batches
- Use database indexes on `is_source`, `is_sink`, `is_ghost`

## Understanding Calculation Window

The service uses a 24-hour window (00:00 to 23:59) for daily analytics:
- Collects all StationStatus records for the day
- Extracts one hourly reading per hour
- Calculates deltas between consecutive hours
- Aggregates metrics for the full day

For 10-day analysis (suggested minimum):
- Captures full weekly cycle (weekdays vs weekends)
- Normalizes outliers
- Provides stable trend indicators

## Next: Production Deployment

1. **Schedule Daily Calculation**
   - Use Celery beat to run management command daily
   - Calculate previous day's analytics in background

2. **Build Frontend Visualizations**
   - Temporal heatmap (hour vs station_id)
   - Flux distribution charts
   - Profile breakdowns

3. **Set Up Alerts**
   - High persistence @ capacity extremes
   - Ghost station detection
   - Anomaly detection

4. **Integrate with Fleet Optimization**
   - Route rebalancing robots to sinks
   - Predict peak times
   - Optimize dock capacity allocation
