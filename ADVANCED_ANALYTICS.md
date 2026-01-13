# Advanced Analytics Implementation - Signal Analysis

## Overview

The project now includes a comprehensive signal analysis system that reconstructs bike flow patterns from API snapshots using mathematical metrics. This replaces trip-level analysis since the Paris Vélib API only provides real-time station status data.

## Core Mathematical Concepts Implemented

### 1. **Hourly Delta (V_h): Velocity of Change**
$$V_h = B_t - B_{t-1}$$

Calculates the net change in bike inventory between consecutive hours.
- **Positive delta**: Net inflow (bikes being returned)
- **Negative delta**: Net outflow (bikes being rented)

### 2. **Shannon Entropy (H): Station Predictability**
$$H = -\Sigma(p_i \log_2(p_i))$$

Measures how predictable a station's behavior is:
- **High entropy (4-8)**: Dynamic, unpredictable (many different flow patterns)
- **Low entropy (0-2)**: Stale, predictable (repetitive patterns)

### 3. **Net Flux: Source/Sink Classification**
$$F = \Sigma V_h$$

Sum of all hourly deltas across a day:
- **Positive flux**: SOURCE (supplies bikes to network)
- **Negative flux**: SINK (demands bikes from network)
- **~Zero flux**: BALANCED HUB (self-sustaining)

### 4. **Persistence: Capacity Extremes**
Measures hours spent at:
- **100% capacity** → needs expansion
- **0% capacity** → needs rebalancing

### 5. **Station Profiles: Daily Heartbeat Categories**

| Profile | Morning (07-10) | Evening (16-19) | Business Logic |
|---------|---|---|---|
| **Commuter Source** | Depleting (ΔB < 0) | Filling (ΔB > 0) | Residential area; needs morning refills |
| **Commuter Sink** | Filling (ΔB > 0) | Depleting (ΔB < 0) | Office/tech hub; needs evening refills |
| **Balanced Hub** | Constant | Constant | High entropy; self-sustaining |
| **Ghost Station** | Low activity + Low entropy | Low activity + Low entropy | Relocation candidate |

## Database Schema

### Enhanced Models

#### `BikeStation`
New field: `profile` (CharField with choices)
- Classifies station into behavioral type
- Auto-updated after analytics calculation

#### `DailyAnalytics`
New fields:
- `average_hourly_delta` (Decimal) - V_h value
- `shannon_entropy` (Decimal) - H value (0-8 range)
- `net_flux` (Decimal) - Sum of all hourly changes
- `persistence_at_full` (Integer) - Hours at 100%
- `persistence_at_empty` (Integer) - Hours at 0%
- `is_source` (Boolean) - Net flux > 5.0
- `is_sink` (Boolean) - Net flux < -5.0
- `is_ghost` (Boolean) - Low entropy + low turnover

## Service: `AdvancedAnalyticsService`

Located in: `apps/analytics/services/advanced_analytics_service.py`

### Key Methods

```python
# Calculate hourly deltas for a station on a date
calculate_hourly_delta(station: BikeStation, date: date) -> List[Dict]

# Calculate Shannon Entropy from delta list
calculate_shannon_entropy(deltas: List[Dict]) -> float

# Calculate net flux (sum of all deltas)
calculate_net_flux(deltas: List[Dict]) -> float

# Calculate persistence at capacity extremes
calculate_persistence(statuses_queryset) -> Tuple[int, int]

# Classify station into profile type
profile_station(entropy, net_flux, avg_delta_magnitude, 
                delta_morning, delta_evening) -> str

# Calculate all analytics for a station on a date
calculate_daily_analytics(station: BikeStation, date: date) -> Dict

# Query top SOURCE stations (last N days)
get_top_sources_and_sinks(days: int = 15, limit: int = 10) -> Dict

# Get Ghost Stations (relocation candidates)
get_ghost_stations(days: int = 15, limit: int = 20) -> List
```

## Management Command

### Calculate Advanced Analytics

Computes all signal analysis metrics across stations and dates.

**Usage:**
```bash
# Last 15 days (default)
python manage.py calculate_advanced_analytics

# Specific date range
python manage.py calculate_advanced_analytics --start-date 2025-01-01 --end-date 2025-01-15

# Specific number of days
python manage.py calculate_advanced_analytics --days 30

# Single station (for testing)
python manage.py calculate_advanced_analytics --station-id 16001
```

**Output:**
- Calculates analytics for all active stations
- Updates station profiles
- Shows top 10 SOURCE stations
- Shows top 10 SINK stations
- Shows top 10 GHOST stations
- Progress updates every 100 stations

## Strategic Use Cases

### 1. Capacity Expansion
Identify stations needing more docks:
```sql
SELECT station_id, name, 
       AVG(persistence_at_full) as avg_full_hours,
       AVG(net_flux) as avg_flux
FROM daily_analytics
WHERE is_source AND persistence_at_full > 10
GROUP BY station_id
ORDER BY avg_full_hours DESC;
```

### 2. Operational Rebalancing
Identify stations needing more bikes:
```sql
SELECT station_id, name,
       AVG(persistence_at_empty) as avg_empty_hours,
       AVG(net_flux) as avg_flux
FROM daily_analytics
WHERE is_sink AND persistence_at_empty > 10
GROUP BY station_id
ORDER BY avg_empty_hours DESC;
```

### 3. Station Optimization
Identify relocation/size reduction candidates:
```sql
SELECT s.station_id, s.name, COUNT(da.id) as ghost_occurrences,
       AVG(da.shannon_entropy) as avg_entropy,
       AVG(da.average_hourly_delta) as avg_turnover
FROM bike_station s
JOIN daily_analytics da ON s.id = da.station_id
WHERE da.is_ghost
GROUP BY s.id
HAVING COUNT(da.id) >= 5
ORDER BY ghost_occurrences DESC;
```

## Admin Interface Updates

The Django admin panel now displays:

### BikeStation List
- Station profile (Commuter Source/Sink, Balanced Hub, Ghost, Unknown)
- Filterable by profile type
- Searchable by ID and name

### DailyAnalytics List
- Shannon entropy value
- Net flux (positive/negative)
- Source/Sink/Ghost flags
- Filterable by all flags
- Date hierarchy browsing

## Data Interpretation Guide

### High Priority Actions

1. **High Persistence @ 100% + Positive Flux**
   - Station overflowing, supplies network
   - Action: Add more docks

2. **High Persistence @ 0% + Negative Flux**
   - Station consistently empty, demands bikes
   - Action: Add more bikes or rebalancing route

3. **Low Entropy + Low Turnover (Ghost)**
   - Station with zero utility
   - Action: Relocate to high-demand area or shrink

4. **High Entropy + Balanced Flux**
   - Self-sustaining "hub" station
   - Action: Monitor for changes, can serve as rebalancing point

## Example Workflow

```python
from apps.analytics.services.advanced_analytics_service import AdvancedAnalyticsService
from apps.analytics.models import BikeStation
from datetime import date

# Get a station
station = BikeStation.objects.get(station_id='16001')

# Calculate daily analytics for a specific date
analytics = AdvancedAnalyticsService.calculate_daily_analytics(station, date(2025, 1, 15))

print(f"Entropy: {analytics['shannon_entropy']}")           # 3.45
print(f"Net Flux: {analytics['net_flux']}")                # -23.50 (SINK)
print(f"Persistence at 0%: {analytics['persistence_at_empty']}")  # 8 hours
print(f"Profile: {analytics['profile']}")                  # commuter_sink
```

## Next Steps

1. **Collect Data**: Run the management command to populate analytics for historical data
2. **Monitor Trends**: Set up periodic calculation (daily/weekly via celery)
3. **Create Visualizations**: Temporal heatmaps and trend charts
4. **Build Alerts**: Notify when thresholds are exceeded
5. **Optimize Fleet**: Use insights to guide rebalancing robots

## Technical Notes

- All calculations use Django ORM for efficiency
- Indexes on `is_source`, `is_sink`, `is_ghost` for fast queries
- Handles gaps in data gracefully (missing hours ignored)
- Thread-safe for concurrent execution
- Decimal fields for precision (avoids floating-point errors)
