# Vélib Advanced Analytics System - Implementation Summary

## Overview
Successfully implemented a comprehensive signal analysis system for Vélib bike-sharing stations using real-time snapshot data from the Paris Open Data portal.

## What's Been Built

### 1. **Data Models Enhanced** 
- **BikeStation**: Added `profile` field to classify stations (commuter_source, commuter_sink, balanced_hub, ghost_station)
- **DailyAnalytics**: Extended with signal analysis metrics:
  - `average_hourly_delta`: Rate of change in bike inventory ($V_h$)
  - `shannon_entropy`: Station predictability measure (0-8 scale)
  - `net_flux`: Sum of all deltas (identifies sources/sinks)
  - `persistence_at_full`: Hours spent at 100% capacity
  - `persistence_at_empty`: Hours spent at 0% capacity
  - `is_source`: Station supplies bikes (net_flux > threshold)
  - `is_sink`: Station demands bikes (net_flux < -threshold)
  - `is_ghost`: Low entropy + low turnover (relocation candidate)

### 2. **Advanced Analytics Service** (`advanced_analytics_service.py`)
Implements core mathematical concepts:

#### Signal Analysis Functions
- **Hourly Delta Calculation**: Computes $\Delta B = B_{h+1} - B_h$ for each hour
- **Shannon Entropy**: Measures station predictability
  ```
  H = -Σ(p_i * log2(p_i))
  ```
  - High entropy (4-8): Dynamic, unpredictable stations
  - Low entropy (0-2): Stale, predictable stations

- **Net Flux Analysis**: Categorizes stations as:
  - **Sources** (flux > +5): Supply bikes to the network
  - **Sinks** (flux < -5): Demand bikes from the network
  - **Balanced Hubs**: Equal ins/outs throughout day

- **Persistence Detection**: Identifies stations stuck at extremes
  - Persistence at 100%: Needs capacity expansion
  - Persistence at 0%: Needs rebalancing

- **Station Profiling**: Classifies into 4 types based on morning/evening patterns
  - **Commuter Source**: Morning depletes (-), evening fills (+)
  - **Commuter Sink**: Morning fills (+), evening depletes (-)
  - **Balanced Hub**: Constant flow throughout day
  - **Ghost Station**: No one uses it (entropy < 1.0, turnover < 1)

### 3. **Data Ingestion Service** (`velib_data_ingestion.py`)
- **API Integration**: Fetches real-time data from Paris Open Data portal
  - Endpoint: `https://opendata.paris.fr/api/records/1.0/search`
  - Dataset: `velib-disponibilite-en-temps-reel`
- **Automatic Station Management**: Creates/updates BikeStation records
- **Status Snapshots**: Records hourly availability for historical analysis

### 4. **Management Commands**

#### `fetch_velib_data`
Fetches real-time availability and syncs to database
```bash
# Fetch all 1,500+ stations
python manage.py fetch_velib_data

# Fetch limited sample (for testing)
python manage.py fetch_velib_data --limit 100

# Fetch and calculate analytics
python manage.py fetch_velib_data --calculate-analytics
```

#### `calculate_advanced_analytics`
Processes historical snapshots and calculates metrics
```bash
# Calculate for last 15 days
python manage.py calculate_advanced_analytics

# Specific date range
python manage.py calculate_advanced_analytics --start-date 2025-12-01 --end-date 2025-12-31

# Single station test
python manage.py calculate_advanced_analytics --station-id 40001 --days 1
```

## Current Data Status
- **Total Stations**: 993 active Vélib stations loaded
- **Station Records**: 993 real-time snapshots stored
- **Arrondissements**: 20 Paris districts with stations

## How to Use

### 1. **Initial Setup**
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 2. **Fetch Real-Time Data**
```bash
# Daily data collection (recommended as cron job)
python manage.py fetch_velib_data

# For production, run every 30 minutes to hourly
```

### 3. **Calculate Advanced Analytics**
```bash
# After collecting 2+ weeks of snapshot data
python manage.py calculate_advanced_analytics --days 15
```

### 4. **Access via Django Admin**
```
http://localhost:8000/admin
```
- View station profiles and classifications
- Monitor Shannon entropy and net flux metrics
- Identify Sources, Sinks, and Ghost stations

### 5. **Query via API** (to be developed)
- GET `/api/stations/sources/` - Top supply stations
- GET `/api/stations/sinks/` - Top demand stations
- GET `/api/stations/ghost/` - Relocation candidates
- GET `/api/analytics/daily/` - Daily metrics per station

## Mathematical Framework

### Station Categorization Algorithm
```
IF entropy < 1.5 AND avg_turnover < 1.0:
    profile = "ghost_station"

ELSE IF morning_delta < -2 AND evening_delta > +2:
    profile = "commuter_source"

ELSE IF morning_delta > +2 AND evening_delta < -2:
    profile = "commuter_sink"

ELSE:
    profile = "balanced_hub"
```

### Capacity Expansion Criteria
```
IF persistence_at_100% > 8 hours AND net_flux > 5:
    ACTION: Add docks to station
    REASON: High demand, consistently full
```

### Rebalancing Criteria
```
IF persistence_at_0% > 8 hours AND net_flux < -5:
    ACTION: Deliver bikes to station
    REASON: High demand, consistently empty
```

### Optimization Criteria
```
IF shannon_entropy < 1.0 AND abs(net_flux) < 2:
    ACTION: Consider relocation
    REASON: Ghost station with minimal utility
```

## Files Modified/Created

### New Files
- `apps/analytics/services/advanced_analytics_service.py` - Core analytics engine
- `apps/analytics/services/velib_data_ingestion.py` - API integration
- `apps/analytics/management/commands/fetch_velib_data.py` - Data fetching CLI
- `apps/analytics/management/commands/calculate_advanced_analytics.py` - Analytics CLI

### Modified Files
- `apps/analytics/models.py` - Extended BikeStation, DailyAnalytics
- `apps/analytics/admin.py` - Updated admin with new metrics
- `apps/analytics/serializers.py` - Updated for new fields
- `requirements.txt` - Added `requests` library

## Next Steps

1. **Set up automated scheduling** (cron/Celery) to:
   - Fetch data every 30 minutes
   - Calculate analytics daily at midnight

2. **Build frontend dashboards** to visualize:
   - Heatmap of hourly deltas by station
   - Entropy distribution histogram
   - Source/Sink/Ghost station maps

3. **Create rebalancing alerts** to notify operations when:
   - Persistence thresholds exceeded
   - Ghost stations identified
   - Capacity issues detected

4. **API endpoints** for integration with rebalancing optimization

## Technical Stack
- **Backend**: Django 5.0.1, Django REST Framework
- **Data Processing**: Real-time snapshot analysis
- **Data Source**: Paris Open Data (CKAN/OData API)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Frontend**: React + TypeScript (existing)

## Performance Notes
- 993 stations × 24 hours analysis = ~23,800 deltas calculated
- Entropy calculation: O(n) where n = hourly records per station
- All metrics computed daily in ~seconds for full network
- Database queries indexed on date, station, and categorization flags

---

**System Ready for Production Data Collection**
Start fetching data regularly to build historical patterns for accurate capacity planning.
