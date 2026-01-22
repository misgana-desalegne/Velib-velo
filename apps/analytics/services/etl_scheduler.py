"""
ETL Pipeline Scheduler

Automatically runs the ETL pipeline at scheduled intervals.
Uses APScheduler to schedule background tasks within the Django process.
"""
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.core.management import call_command
from django.conf import settings

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler = None


def get_scheduler():
    """Get or create the background scheduler"""
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
    return _scheduler


def start_etl_scheduler():
    """
    Start the ETL pipeline scheduler
    Runs every hour by default (configurable via settings)
    """
    scheduler = get_scheduler()
    
    # Check if scheduler is already running
    if scheduler.running:
        logger.info("ETL Scheduler is already running")
        return
    
    # Get configuration from Django settings or use defaults
    interval_hours = getattr(settings, 'ETL_SCHEDULER_INTERVAL_HOURS', 1)
    etl_limit = getattr(settings, 'ETL_SCHEDULER_RECORD_LIMIT', 10000)
    enabled = getattr(settings, 'ETL_SCHEDULER_ENABLED', True)

    status_enabled = getattr(settings, 'STATION_STATUS_SCHEDULER_ENABLED', True)
    status_interval_hours = getattr(settings, 'STATION_STATUS_SCHEDULER_INTERVAL_HOURS', 1)
    status_limit = getattr(settings, 'STATION_STATUS_SCHEDULER_RECORD_LIMIT', 10000)
    
    if not enabled:
        logger.info("ETL Scheduler is disabled in settings")
        return
    
    try:
        # Add job to run ETL pipeline every N hours
        if enabled:
            scheduler.add_job(
                func=run_etl_job,
                trigger=IntervalTrigger(hours=interval_hours),
                id='etl_pipeline_hourly',
                name='ETL Pipeline Hourly Run',
                kwargs={'limit': etl_limit},
                replace_existing=True,
                max_instances=1  # Prevent concurrent executions
            )

        # Add job to fetch station status snapshots every N hours
        if status_enabled:
            scheduler.add_job(
                func=run_station_status_job,
                trigger=IntervalTrigger(hours=status_interval_hours),
                id='station_status_hourly',
                name='Station Status Hourly Snapshot',
                kwargs={'limit': status_limit},
                replace_existing=True,
                max_instances=1
            )
        
        # Start the scheduler
        scheduler.start()
        
        if enabled:
            logger.info(f"ETL Scheduler started - runs every {interval_hours} hour(s)")
            logger.info(f"Record limit per run: {etl_limit}")
        if status_enabled:
            logger.info(f"Station status scheduler started - runs every {status_interval_hours} hour(s)")
            logger.info(f"Status record limit per run: {status_limit}")
        
    except Exception as e:
        logger.error(f"Failed to start ETL Scheduler: {e}")


def stop_etl_scheduler():
    """Stop the ETL pipeline scheduler"""
    scheduler = get_scheduler()
    
    if scheduler.running:
        try:
            scheduler.shutdown()
            logger.info("ETL Scheduler stopped")
        except Exception as e:
            logger.error(f"Error stopping ETL Scheduler: {e}")
    else:
        logger.info("ETL Scheduler is not running")


def run_etl_job(limit=10000):
    """
    Background job that runs the ETL pipeline
    
    Args:
        limit: Maximum number of records to extract
    """
    try:
        logger.info(f"Starting scheduled ETL pipeline run at {datetime.now()}")
        
        # Call the management command
        call_command('run_etl_pipeline', limit=limit)
        
        logger.info(f"Scheduled ETL pipeline run completed at {datetime.now()}")
        
    except Exception as e:
        logger.error(f"Error during scheduled ETL pipeline run: {e}")


def run_station_status_job(limit=10000):
    """
    Background job that fetches station status snapshots

    Args:
        limit: Maximum number of records to extract
    """
    try:
        logger.info(f"Starting scheduled station status snapshot at {datetime.now()}")

        call_command('fetch_velib_data', limit=limit)

        logger.info(f"Scheduled station status snapshot completed at {datetime.now()}")

    except Exception as e:
        logger.error(f"Error during scheduled station status snapshot: {e}")


def get_scheduler_status():
    """
    Get current scheduler status
    
    Returns:
        Dictionary with scheduler information
    """
    scheduler = get_scheduler()
    
    status = {
        'running': scheduler.running,
        'jobs': []
    }
    
    if scheduler.running:
        for job in scheduler.get_jobs():
            status['jobs'].append({
                'id': job.id,
                'name': job.name,
                'next_run_time': str(job.next_run_time),
                'trigger': str(job.trigger)
            })
    
    return status
