# Projet Vélib - Complete Implementation Guide

## ✅ System Status: Fully Implemented and Tested

### What's Running Now

**Server**: `http://localhost:8000`
**Admin Panel**: `http://localhost:8000/admin`
**API Base**: `http://localhost:8000/api/`

---

## 📊 Architecture Overview

```
Real-Time Data (Paris Open Data API)
         ↓
[VelibDataIngestionService]
         ↓
Database: BikeStation + StationStatus snapshots
         ↓
[AdvancedAnalyticsService]
         ↓
DailyAnalytics: Entropy, Flux, Persistence metrics
         ↓
API Endpoints + Django Admin Interface
```

---

## 🚀 Quick Start

### 1. First Time Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create admin account
python manage.py createsuperuser
```

### 2. Fetch Real-Time Data
```bash
# Download all 1,500+ stations from Paris Open Data
python manage.py fetch_velib_data

# Or fetch sample for testing
python manage.py fetch_velib_data --limit 100
```

### 3. Calculate Analytics (requires 2+ weeks of data)
```bash
# Calculate metrics for last 15 days
python manage.py calculate_advanced_analytics --days 15

# Or specific date range
python manage.py calculate_advanced_analytics --start-date 2025-12-01 --end-date 2025-12-31
```

---

## 📡 API Endpoints

### Advanced Analytics
```
GET  /api/advanced-analytics/               # List all analytics records
GET  /api/advanced-analytics/sources/       # Top SOURCE stations (supply)
GET  /api/advanced-analytics/sinks/         # Top SINK stations (demand)
GET  /api/advanced-analytics/ghost_stations/  # GHOST stations (candidates for relocation)
GET  /api/advanced-analytics/summary/       # Network-wide summary
```

### Station Profiles
```
GET  /api/stations-profile/                 # All stations with profiles
GET  /api/stations-profile/by_profile/      # Filter by profile type
     ?profile=commuter_source|commuter_sink|balanced_hub|ghost_station
```

### Analytics Data
```
GET  /api/analytics/                        # All daily analytics
     ?is_source=true                        # Filter by source
     ?is_sink=true                          # Filter by sink
     ?is_ghost=true                         # Filter by ghost
     ?date=2025-01-15                       # Specific date
```

---

## 🎯 Core Concepts

### Station Profiles

| Profile | Meaning | Action |
|---------|---------|--------|
| **Commuter Source** | Supplies bikes (residential → work) | Monitor supply |
| **Commuter Sink** | Demands bikes (work → residential) | Plan rebalancing |
| **Balanced Hub** | Self-sustaining (constant flow) | Use as hub |
| **Ghost Station** | Unused/low utility | Consider relocation |

### Key Metrics

| Metric | Formula | Interpretation |
|--------|---------|-----------------|
| **Hourly Delta** | $\Delta B = B_t - B_{t-1}$ | Change in bike count per hour |
| **Shannon Entropy** | $H = -\Sigma p_i \log_2(p_i)$ | Station predictability (0=stale, 8=dynamic) |
| **Net Flux** | $F = \Sigma \Delta B$ | Total daily change (source if positive) |
| **Persistence** | Hours at 0% or 100% | Capacity issues indicator |

### Decision Framework

**Capacity Expansion**
```
IF persistence_at_100% > 8 hours AND net_flux > +5:
    RECOMMENDATION: Add more docks
    REASON: Station consistently full, high demand
```

**Rebalancing**
```
IF persistence_at_0% > 8 hours AND net_flux < -5:
    RECOMMENDATION: Deliver bikes
    REASON: Station consistently empty, high demand unmet
```

**Optimization** 
```
IF shannon_entropy < 1.0 AND avg_turnover < 1 bike/hour:
    RECOMMENDATION: Relocate or downsize
    REASON: Ghost station with minimal utility
```

---

## 📚 Management Commands

### `fetch_velib_data`
Fetches real-time data from Paris Open Data API and syncs to database.

```bash
# Fetch all stations
python manage.py fetch_velib_data

# Fetch limited sample
python manage.py fetch_velib_data --limit 50

# Fetch + calculate analytics
python manage.py fetch_velib_data --calculate-analytics
```

**Output**:
- Creates BikeStation records
- Updates station availability
- Creates StationStatus snapshots
- Optionally calculates daily analytics

### `calculate_advanced_analytics`
Processes historical snapshots and computes signal analysis metrics.

```bash
# Calculate for last 15 days (default)
python manage.py calculate_advanced_analytics

# Specific date range
python manage.py calculate_advanced_analytics --start-date 2025-01-01 --end-date 2025-01-15

# Specific number of days
python manage.py calculate_advanced_analytics --days 30

# Single station (testing)
python manage.py calculate_advanced_analytics --station-id 40001
```

**Calculates**:
- Hourly deltas for each station/hour
- Shannon entropy (predictability)
- Net flux (source/sink classification)
- Persistence metrics
- Station profiles

---

## 🗂️ Database Schema

### BikeStation
```python
station_id       # Unique identifier (e.g., '40001')
name             # Station name
arrondissement   # FK to Arrondissement
latitude         # Location
longitude        # Location
total_docks      # Capacity
is_active        # Operating status
profile          # Profile type (NEW)
```

### StationStatus
```python
station          # FK to BikeStation
timestamp        # When measured
available_bikes  # Bike count
available_docks  # Empty slot count
is_operational   # Operational status
utilization_rate # Calculated property (%)
```

### DailyAnalytics (NEW)
```python
date                    # Date
station / arrondissement # Location
total_trips             # Hourly transitions
average_utilization     # % utilization

# Advanced metrics (NEW):
average_hourly_delta    # V_h - rate of change
shannon_entropy         # H - predictability
net_flux                # F - total daily change
persistence_at_full     # Hours at 100%
persistence_at_empty    # Hours at 0%
is_source               # Boolean flag
is_sink                 # Boolean flag
is_ghost                # Boolean flag
```

---

## 🔍 Usage Examples

### Django Admin
1. Go to `http://localhost:8000/admin/`
2. Login with superuser credentials
3. Browse:
   - **Stations**: View profiles, search by ID or name
   - **Daily Analytics**: Filter by source/sink/ghost, browse by date
   - **Arrondissements**: View station counts per district

### Python Shell
```bash
python manage.py shell
```

```python
from apps.analytics.services.advanced_analytics_service import AdvancedAnalyticsService

# Get top sources and sinks
results = AdvancedAnalyticsService.get_top_sources_and_sinks(days=15, limit=10)
for source in results['sources']:
    print(f"{source['station__name']}: {source['avg_net_flux']:.2f} bikes/day")

# Get ghost stations
ghosts = AdvancedAnalyticsService.get_ghost_stations(days=15, limit=5)
for ghost in ghosts:
    print(f"{ghost['station__name']}: entropy={ghost['avg_entropy']:.2f}")

# Single station analysis
from apps.analytics.models import BikeStation
from datetime import date

station = BikeStation.objects.get(station_id='40001')
analytics = AdvancedAnalyticsService.calculate_daily_analytics(station, date.today())
print(f"Profile: {analytics['profile']}")
print(f"Entropy: {analytics['shannon_entropy']}")
print(f"Net Flux: {analytics['net_flux']}")
```

### REST API
```bash
# Get top sources
curl http://localhost:8000/api/advanced-analytics/sources/?days=15&limit=10

# Get top sinks  
curl http://localhost:8000/api/advanced-analytics/sinks/?days=15&limit=10

# Get ghost stations
curl http://localhost:8000/api/advanced-analytics/ghost_stations/?days=15&limit=10

# Network summary
curl http://localhost:8000/api/advanced-analytics/summary/?days=15

# All stations with profiles
curl http://localhost:8000/api/stations-profile/

# Filter by profile type
curl http://localhost:8000/api/stations-profile/by_profile/?profile=commuter_sink
```

---

## ⚙️ Configuration for Production

### 1. Schedule Data Fetching (every 30 minutes or hourly)

**Option A: Using Celery Beat**
```python
# settings.py
CELERY_BEAT_SCHEDULE = {
    'fetch-velib-data': {
        'task': 'apps.analytics.tasks.fetch_and_sync_velib_data',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

**Option B: Using cron**
```bash
# Fetch data every hour at :00
0 * * * * cd /path/to/project && python manage.py fetch_velib_data

# Calculate analytics daily at 01:00
0 1 * * * cd /path/to/project && python manage.py calculate_advanced_analytics --days 1
```

### 2. Database Optimization

For PostgreSQL:
```bash
# Create indexes
python manage.py sqlsequencereset analytics | python manage.py dbshell

# Analyze for query optimization
VACUUM ANALYZE;
```

### 3. Monitor with Alerts

```python
from apps.analytics.models import DailyAnalytics

# Find capacity issues
capacity_issues = DailyAnalytics.objects.filter(
    persistence_at_full__gte=12,
    is_source=True
)

# Find rebalancing needs
rebalancing = DailyAnalytics.objects.filter(
    persistence_at_empty__gte=12,
    is_sink=True
)

# Send alerts if critical
if capacity_issues.count() > 10:
    send_alert("Critical: 10+ stations at capacity")
```

---

## 📈 Metrics & KPIs

### Network Health
- Total active stations: 993 (as of Jan 12, 2026)
- Average entropy: [varies with data]
- Source stations: [auto-calculated]
- Sink stations: [auto-calculated]
- Ghost stations: [auto-calculated]

### Operational Insights
- Highest demand time: [from morning deltas]
- Lowest supply time: [from evening deltas]
- Rebalancing routes needed: [from negative flux clusters]
- Expansion candidates: [high persistence @ 100%]

---

## 🐛 Troubleshooting

### "No stations found"
- Run `python manage.py fetch_velib_data` first

### "No analytics available"  
- Need at least 24 hours of snapshot data
- Then run `python manage.py calculate_advanced_analytics`

### API returns empty sources/sinks
- Analytics require 2+ weeks of historical data for reliable patterns
- Collect data first, then analyze

### Performance is slow
- Ensure database indexes are created: `python manage.py migrate`
- Use `select_related()` and `prefetch_related()` in queries
- Consider PostgreSQL for large datasets

---

## 📖 Documentation Files

- **ADVANCED_ANALYTICS.md** - Detailed technical reference
- **QUICKSTART_ANALYTICS.md** - Quick usage guide
- **ANALYTICS_IMPLEMENTATION.md** - Implementation summary
- **IMPLEMENTATION_SUMMARY.md** - Architecture overview

---

## 🔗 Useful Links

- **Data Source**: https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/
- **Django Admin**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/
- **GitHub**: [Your repository URL]

---

## ✨ Summary

**Système complet d'analyse Vélib basé sur des données en temps réel!**

✅ 993 stations actuellement suivies
✅ Analyses mathématiques avancées (entropie, flux, persistance)
✅ Classifications automatiques (Source/Sink/Hub/Ghost)
✅ API REST complète pour l'intégration
✅ Interface d'administration Django
✅ Prêt pour déploiement en production

**Prochaines étapes**: Collecter 2+ semaines de données pour des analyses fiables, puis mettre en place le tableau de bord frontend.
