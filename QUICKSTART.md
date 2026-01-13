# 🚀 ETL Pipeline - Quick Start Guide

## Installation Complete ✅

APScheduler and all dependencies are installed.

## Start the System

### Step 1: Start Django Server
```bash
python manage.py runserver
```
**The scheduler auto-starts automatically!**

### Step 2: Verify Scheduler is Running
```bash
python test_scheduler.py
```

Or:
```bash
python manage.py etl_scheduler status
```

### Step 3: Monitor ETL Runs (Optional)
```bash
python manage.py run_etl_pipeline --limit 50 --verbose
```

## What's Happening

1. **Every Hour**: Scheduler automatically runs ETL pipeline
2. **Extraction**: Fetches 10,000 bike station records from Vélib API
3. **Transformation**: Cleans data, calculates metrics
4. **Loading**: Inserts into database (communes, stations, statuses)

## Current Data Loaded

- ✅ **13 Communes** (auto-discovered)
- ✅ **50 Bike Stations** (with GPS coordinates)
- ✅ **Real-time Statuses** (available bikes/docks)

## Database Tables Updated

```
django_admin @ localhost:8000/admin/

1. Communes
   - code_insee_commune (e.g., "75056" for Paris)
   - name (e.g., "Paris", "Clichy")
   
2. BikeStation
   - station_id (e.g., "21108")
   - name (e.g., "Mairie de Clichy")
   - latitude / longitude
   - total_docks (capacity)
   
3. StationStatus
   - available_bikes (real-time count)
   - available_docks (real-time count)
   - timestamp (when measured)
   - is_operational (status)
```

## Test Commands

### View All Data
```bash
# Django shell
python manage.py shell

>>> from apps.analytics.models import Commune, BikeStation, StationStatus
>>> Commune.objects.all().count()  # See how many communes
>>> BikeStation.objects.all().count()  # See how many stations
>>> StationStatus.objects.all().count()  # See how many status snapshots
```

### Check Database
```bash
# Web UI (if Django admin is enabled)
python manage.py runserver
# Visit: http://localhost:8000/admin/
```

### Schedule Status
```bash
python manage.py etl_scheduler status
```

### Manual ETL Run
```bash
# Extract 100 records now (don't wait for scheduler)
python manage.py run_etl_pipeline --limit 100

# Verbose output
python manage.py run_etl_pipeline --limit 50 --verbose
```

## Configuration

In `projet_velib/settings.py`:
```python
# Change how often ETL runs
ETL_SCHEDULER_INTERVAL_HOURS = 1    # Every 1 hour

# Change how many records per run
ETL_SCHEDULER_RECORD_LIMIT = 10000  # Up to 10,000

# Disable if needed
ETL_SCHEDULER_ENABLED = False
```

## Logs

Check Django logs to see what's happening:
```bash
# Tail logs while server is running
# Look in console where you ran: python manage.py runserver
```

## Need Help?

- **Scheduler not starting?** → Make sure `ETL_SCHEDULER_ENABLED = True` in settings.py
- **No data loading?** → Check Django migrations: `python manage.py migrate`
- **Slow performance?** → Reduce `ETL_SCHEDULER_INTERVAL_HOURS` or `ETL_SCHEDULER_RECORD_LIMIT`

## Architecture

```
YOUR MACHINE
│
├─ Django Server (runserver)
│  │
│  └─ APScheduler (Background)
│     │
│     └─ Every 1 Hour:
│        1. Extract: Velib API → 10,000 records
│        2. Transform: Clean, normalize, aggregate
│        3. Load: Save to SQLite database
│
└─ SQLite Database (db.sqlite3)
   ├─ Communes
   ├─ BikeStations
   └─ StationStatus
```

## What Runs Every Hour

```python
# Automatically runs this command every hour:
python manage.py run_etl_pipeline --limit 10000
```

## Success = You Should See

1. ✅ Django server running without errors
2. ✅ Scheduler initialized on startup
3. ✅ Every hour: New ETL job completes
4. ✅ Database grows with new data
5. ✅ Django admin shows stations/statuses

## Next Features to Build

- [ ] Daily/Weekly analytics dashboard
- [ ] Station behavior classification
- [ ] Predictive availability alerts
- [ ] Web API endpoints
- [ ] Visualization maps

---

**The system is live! Your data is updating automatically every hour.** 🎉
