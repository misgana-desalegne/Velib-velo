# ETL Scheduler Quick Reference

## Installation

```bash
pip install apscheduler
```

## Configuration (Add to settings.py)

```python
# Enable the scheduler
ETL_SCHEDULER_ENABLED = True

# Run every hour (1 = hourly, 0.5 = 30 min, 6 = 6 hours, 24 = daily)
ETL_SCHEDULER_INTERVAL_HOURS = 1

# Extract up to 10000 records per run
ETL_SCHEDULER_RECORD_LIMIT = 10000
```

## Management Commands

```bash
# Start scheduler
python manage.py etl_scheduler start

# Stop scheduler  
python manage.py etl_scheduler stop

# Check status
python manage.py etl_scheduler status

# Manually run ETL now
python manage.py run_etl_pipeline

# Run ETL with custom limit
python manage.py run_etl_pipeline --limit 5000

# Verbose output
python manage.py run_etl_pipeline --verbose
```

## How It Works

1. **Auto-Start**: Scheduler starts automatically when Django starts
2. **Hourly Runs**: ETL pipeline runs every hour (configurable)
3. **Background**: Runs in background without blocking requests
4. **Logging**: All runs are logged with timestamps

## Example Output

```
$ python manage.py etl_scheduler status

ETL Scheduler Status:
  Running: True
  Jobs (1):
    - ETL Pipeline Hourly Run
      ID: etl_pipeline_hourly
      Next Run: 2026-01-13 15:45:23.456789
      Trigger: interval[0:01:00]
```

## Programmatic Usage

```python
from apps.analytics.services.etl_scheduler import (
    start_etl_scheduler,
    stop_etl_scheduler,
    get_scheduler_status,
    run_etl_job
)

# Start scheduler
start_etl_scheduler()

# Get status
status = get_scheduler_status()
print(status['running'])  # True/False

# Run ETL manually
run_etl_job(limit=10000)

# Stop scheduler
stop_etl_scheduler()
```

## Common Schedules

| Frequency | Setting |
|-----------|---------|
| Every 30 minutes | `ETL_SCHEDULER_INTERVAL_HOURS = 0.5` |
| Every hour | `ETL_SCHEDULER_INTERVAL_HOURS = 1` |
| Every 6 hours | `ETL_SCHEDULER_INTERVAL_HOURS = 6` |
| Daily | `ETL_SCHEDULER_INTERVAL_HOURS = 24` |
| Disabled | `ETL_SCHEDULER_ENABLED = False` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Scheduler doesn't start | Check settings.py and APScheduler installation |
| "apscheduler" not found | `pip install apscheduler` |
| Slow performance | Reduce frequency or record limit |
| Multiple concurrent runs | Scheduler prevents this automatically |

For full documentation, see [ETL_SCHEDULER_README.md](ETL_SCHEDULER_README.md)
