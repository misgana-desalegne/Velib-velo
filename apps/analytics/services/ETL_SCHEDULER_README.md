# ETL Pipeline Scheduler Documentation

## Overview

The ETL Pipeline Scheduler automatically runs the data extraction, transformation, and loading process at regular intervals while the Django server is running. By default, it runs **every hour** to keep your data fresh and up-to-date with the latest Vélib bike station information.

## Features

- ✅ **Automatic Hourly Execution** - Runs every hour by default
- ✅ **In-Process Scheduling** - No external services required (unlike Celery)
- ✅ **Background Operation** - Doesn't block the Django server
- ✅ **Configurable Intervals** - Run every 30 minutes, hourly, daily, etc.
- ✅ **Max Instances Protection** - Prevents concurrent pipeline runs
- ✅ **Comprehensive Logging** - Track all scheduled executions
- ✅ **Easy Management** - Start, stop, and monitor via management commands

## How It Works

1. **Initialization**: When Django starts, the scheduler is automatically initialized
2. **Scheduling**: The ETL pipeline is scheduled to run at specified intervals
3. **Background Execution**: Jobs run in the background without blocking requests
4. **Logging**: All runs are logged with timestamps and status

## Installation

### 1. Install APScheduler

```bash
pip install apscheduler
```

### 2. Add Configuration to `settings.py`

```python
# ETL Pipeline Scheduler Settings
ETL_SCHEDULER_ENABLED = True
ETL_SCHEDULER_INTERVAL_HOURS = 1  # Run every hour
ETL_SCHEDULER_RECORD_LIMIT = 10000  # Extract up to 10000 records
```

Alternatively, copy the settings from `ETL_SCHEDULER_SETTINGS.py` to your Django settings.

### 3. Ensure Analytics App is in INSTALLED_APPS

```python
INSTALLED_APPS = [
    # ...
    'apps.analytics',
]
```

## Configuration

### Environment Variables / Settings

Edit your `settings.py` to control scheduler behavior:

```python
# Enable/disable the scheduler
ETL_SCHEDULER_ENABLED = True

# Run interval (in hours)
# 0.5 = every 30 minutes
# 1 = every hour (default)
# 6 = every 6 hours
# 24 = daily
ETL_SCHEDULER_INTERVAL_HOURS = 1

# Records to extract per run
# Higher limit = more data but slower processing
ETL_SCHEDULER_RECORD_LIMIT = 10000
```

### Common Configurations

#### Run Every 30 Minutes
```python
ETL_SCHEDULER_INTERVAL_HOURS = 0.5
```

#### Run Every 6 Hours
```python
ETL_SCHEDULER_INTERVAL_HOURS = 6
```

#### Run Daily
```python
ETL_SCHEDULER_INTERVAL_HOURS = 24
```

#### Disable Scheduler
```python
ETL_SCHEDULER_ENABLED = False
```

## Usage

### Automatic Start

The scheduler automatically starts when Django starts:

```bash
# Start Django development server
python manage.py runserver
# Scheduler automatically starts in the background
```

### Manual Control

#### Start the Scheduler

```bash
python manage.py etl_scheduler start
```

Output:
```
Starting ETL Scheduler...
ETL Scheduler started successfully!
```

#### Stop the Scheduler

```bash
python manage.py etl_scheduler stop
```

Output:
```
Stopping ETL Scheduler...
ETL Scheduler stopped!
```

#### Check Scheduler Status

```bash
python manage.py etl_scheduler status
```

Output:
```
ETL Scheduler Status:
  Running: True
  Jobs (1):
    - ETL Pipeline Hourly Run
      ID: etl_pipeline_hourly
      Next Run: 2026-01-13 15:45:23.456789
      Trigger: interval[0:01:00]
```

### Manual Trigger

Run the ETL pipeline immediately without waiting for the scheduled time:

```bash
python manage.py run_etl_pipeline
```

Or with custom parameters:

```bash
python manage.py run_etl_pipeline --limit 5000
```

## Execution Flow

```
Server Starts
    ↓
Django Initialize
    ↓
AnalyticsConfig.ready()
    ↓
ETL Scheduler Starts
    ↓
Schedule Job: "Run ETL every 1 hour"
    ↓
Background Process Active
    ↓
Every Hour: Extract → Transform → Load
    ↓
Log Results
    ↓
Repeat until Server Stops
```

## Logging

All scheduled ETL runs are logged. Check your Django logs for execution details:

```
INFO: Starting scheduled ETL pipeline run at 2026-01-13 14:45:23.123456
INFO: Extracted 1500 records from Vélib API
INFO: Cleaned 1500 records
INFO: Aggregated to 50 daily records
INFO: Aggregated to 10 weekly records
INFO: Loaded 5 communes
INFO: Loaded 200 stations
INFO: Loaded 1500 station status records
INFO: Loaded 50 daily analytics records
INFO: Loaded 10 weekly analytics records
INFO: Scheduled ETL pipeline run completed at 2026-01-13 14:50:32.654321
```

### Configure Logging

To increase verbosity, update your Django logging configuration:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'etl_scheduler.log',
        },
    },
    'loggers': {
        'apps.analytics': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apscheduler': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

## API Reference

### Scheduler Functions

#### `start_etl_scheduler()`

Start the background scheduler. Called automatically on Django startup.

```python
from apps.analytics.services.etl_scheduler import start_etl_scheduler

start_etl_scheduler()
```

#### `stop_etl_scheduler()`

Stop the background scheduler gracefully.

```python
from apps.analytics.services.etl_scheduler import stop_etl_scheduler

stop_etl_scheduler()
```

#### `get_scheduler_status()`

Get current scheduler status and active jobs.

```python
from apps.analytics.services.etl_scheduler import get_scheduler_status

status = get_scheduler_status()
print(status)
# Output:
# {
#     'running': True,
#     'jobs': [
#         {
#             'id': 'etl_pipeline_hourly',
#             'name': 'ETL Pipeline Hourly Run',
#             'next_run_time': '2026-01-13 15:45:23.123456',
#             'trigger': 'interval[0:01:00]'
#         }
#     ]
# }
```

#### `run_etl_job(limit=10000)`

Manually execute the ETL pipeline job (usually called by scheduler).

```python
from apps.analytics.services.etl_scheduler import run_etl_job

run_etl_job(limit=10000)
```

### Management Commands

#### `etl_scheduler`

Control the scheduler from the command line.

```bash
# Start
python manage.py etl_scheduler start

# Stop
python manage.py etl_scheduler stop

# Get status
python manage.py etl_scheduler status
```

#### `run_etl_pipeline`

Manually run the ETL pipeline.

```bash
# Default (extract 10000 records)
python manage.py run_etl_pipeline

# Custom limit
python manage.py run_etl_pipeline --limit 5000

# Verbose output
python manage.py run_etl_pipeline --verbose
```

## Deployment Considerations

### Development Environment

The scheduler works out-of-the-box in development:

```bash
python manage.py runserver
# Scheduler runs automatically
```

### Production Environment

#### Using gunicorn (single worker)

```bash
# Only works with single worker
gunicorn projet_velib.wsgi --workers=1
# Scheduler runs in the worker process
```

**Note**: Ensure only one worker process is running, or implement process locking to prevent concurrent executions.

#### Using gunicorn (multiple workers)

For multiple workers, you have two options:

**Option 1**: Run scheduler in a separate process

```bash
# Worker process
gunicorn projet_velib.wsgi --workers=4

# Scheduler process (separate terminal/container)
python manage.py etl_scheduler start
```

**Option 2**: Use Celery + Beat (recommended for scaling)

```bash
# Worker processes
celery -A projet_velib worker

# Beat scheduler
celery -A projet_velib beat
```

#### Using uWSGI

```bash
# Single process
uwsgi --http :8000 --wsgi-file projet_velib/wsgi.py --master

# Multi-process (need external scheduler)
uwsgi --http :8000 --wsgi-file projet_velib/wsgi.py --processes 4
```

### Docker / Container Deployment

For containerized deployments, keep the scheduler in the main application container:

```dockerfile
FROM python:3.11

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Run Django with scheduler
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

## Troubleshooting

### Issue: Scheduler doesn't start on server startup

**Solution**: Check that:
1. `ETL_SCHEDULER_ENABLED = True` in settings.py
2. APScheduler is installed: `pip install apscheduler`
3. Analytics app is in INSTALLED_APPS
4. No errors in Django logs

### Issue: "apscheduler" module not found

**Solution**: Install APScheduler

```bash
pip install apscheduler
```

### Issue: ETL runs are too slow, blocking requests

**Solution**: Configure scheduler to run less frequently or extract fewer records:

```python
# Run every 6 hours instead of every 1 hour
ETL_SCHEDULER_INTERVAL_HOURS = 6

# Extract fewer records
ETL_SCHEDULER_RECORD_LIMIT = 5000
```

### Issue: Multiple simultaneous ETL runs

**Solution**: The scheduler uses `max_instances=1` to prevent concurrent runs. If you still see issues:

1. Check scheduler status: `python manage.py etl_scheduler status`
2. Restart scheduler: `python manage.py etl_scheduler stop && python manage.py etl_scheduler start`

### Issue: Scheduler stops after some time

**Solution**: This typically happens with:
- Thread pool exhaustion
- Memory leaks
- Unhandled exceptions

Monitor logs and consider:
- Reducing extraction frequency
- Enabling more verbose logging
- Checking available system memory

## Performance Tips

### For Hourly Runs

```python
ETL_SCHEDULER_ENABLED = True
ETL_SCHEDULER_INTERVAL_HOURS = 1
ETL_SCHEDULER_RECORD_LIMIT = 10000
```

**Expected Duration**: 15-45 seconds per run

### For High-Frequency Monitoring (Every 30 minutes)

```python
ETL_SCHEDULER_INTERVAL_HOURS = 0.5
ETL_SCHEDULER_RECORD_LIMIT = 5000
```

**Expected Duration**: 10-20 seconds per run

### For Daily Aggregation (Once per day)

```python
ETL_SCHEDULER_INTERVAL_HOURS = 24
ETL_SCHEDULER_RECORD_LIMIT = 10000
```

**Expected Duration**: 15-45 seconds per run

## Examples

### Example 1: Basic Setup (Hourly)

```python
# settings.py
ETL_SCHEDULER_ENABLED = True
ETL_SCHEDULER_INTERVAL_HOURS = 1
ETL_SCHEDULER_RECORD_LIMIT = 10000
```

```bash
# Start server
python manage.py runserver
# ETL runs automatically every hour
```

### Example 2: Frequent Updates (Every 30 minutes)

```python
# settings.py
ETL_SCHEDULER_ENABLED = True
ETL_SCHEDULER_INTERVAL_HOURS = 0.5  # 30 minutes
ETL_SCHEDULER_RECORD_LIMIT = 5000
```

### Example 3: Programmatic Control

```python
# views.py or management command
from apps.analytics.services.etl_scheduler import (
    start_etl_scheduler,
    stop_etl_scheduler,
    get_scheduler_status,
    run_etl_job
)

# Start scheduler
start_etl_scheduler()

# Check status
status = get_scheduler_status()
if status['running']:
    print("Scheduler is running")
    for job in status['jobs']:
        print(f"Next run: {job['next_run_time']}")

# Manually run ETL
run_etl_job(limit=10000)

# Stop scheduler
stop_etl_scheduler()
```

### Example 4: Custom Cron-like Schedule (via crontab)

For precise scheduling, use system cron alongside the scheduler:

```bash
# /etc/crontab - Run manual ETL at specific times
0 * * * * cd /path/to/project && python manage.py run_etl_pipeline --limit 10000
0 12 * * * cd /path/to/project && python manage.py run_etl_pipeline --limit 10000
0 18 * * * cd /path/to/project && python manage.py run_etl_pipeline --limit 10000
```

## Future Enhancements

- [ ] Web UI for scheduler monitoring
- [ ] Custom schedule expressions (cron-like)
- [ ] Job history and statistics
- [ ] Failed job retry logic
- [ ] Slack/Email notifications on completion
- [ ] Performance metrics dashboard

## Support

For issues or questions:
1. Check the logs: `tail -f etl_scheduler.log`
2. Run scheduler status: `python manage.py etl_scheduler status`
3. Review configuration in `settings.py`
4. Enable verbose logging for more details
