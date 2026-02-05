"""
Django management command to control the ETL scheduler
Usage: python manage.py etl_scheduler start
       python manage.py etl_scheduler stop
       python manage.py etl_scheduler status
"""
from django.core.management.base import BaseCommand, CommandError
from apps.analytics.services.etl_scheduler import (
    start_etl_scheduler, stop_etl_scheduler, get_scheduler_status
)
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Manage the ETL pipeline scheduler'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            type=str,
            choices=['start', 'stop', 'status'],
            help='Action to perform: start, stop, or status'
        )
    
    def handle(self, *args, **options):
        action = options['action']
        
        try:
            if action == 'start':
                self.stdout.write(self.style.SUCCESS('Starting ETL Scheduler...'))
                start_etl_scheduler()
                self.stdout.write(self.style.SUCCESS('ETL Scheduler started successfully!'))
                
            elif action == 'stop':
                self.stdout.write(self.style.WARNING('Stopping ETL Scheduler...'))
                stop_etl_scheduler()
                self.stdout.write(self.style.SUCCESS('ETL Scheduler stopped!'))
                
            elif action == 'status':
                status = get_scheduler_status()
                self.stdout.write(self.style.SUCCESS('ETL Scheduler Status:'))
                self.stdout.write(f"  Running: {status['running']}")
                if status['jobs']:
                    self.stdout.write(f"  Jobs ({len(status['jobs'])}):")
                    for job in status['jobs']:
                        self.stdout.write(f"    - {job['name']}")
                        self.stdout.write(f"      ID: {job['id']}")
                        self.stdout.write(f"      Next Run: {job['next_run_time']}")
                        self.stdout.write(f"      Trigger: {job['trigger']}")
                else:
                    self.stdout.write("  No jobs scheduled")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            raise CommandError(f'Scheduler error: {str(e)}')
