"""
Django management command to run the ETL pipeline
Usage: python manage.py run_etl_pipeline
       python manage.py run_etl_pipeline --limit 5000
"""
from django.core.management.base import BaseCommand, CommandError
from apps.analytics.services.etl_pipeline import ETLPipeline
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run the ETL pipeline to extract, transform, and load bike station data from Vélib API'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=10000,
            help='Maximum number of records to extract (default: 10000)'
        )
        
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose logging'
        )
    
    def handle(self, *args, **options):
        limit = options['limit']
        verbose = options.get('verbose', False)
        
        # Setup logging
        if verbose:
            logging.basicConfig(level=logging.DEBUG)
        else:
            logging.basicConfig(level=logging.INFO)
        
        self.stdout.write(self.style.SUCCESS('Starting ETL Pipeline...'))
        
        try:
            pipeline = ETLPipeline()
            result = pipeline.run(limit=limit)
            
            # Display result
            status_report = pipeline.get_pipeline_status(result)
            self.stdout.write(status_report)
            
            if result['status'] == 'success':
                self.stdout.write(self.style.SUCCESS('ETL Pipeline completed successfully!'))
                return
            else:
                self.stdout.write(self.style.ERROR('ETL Pipeline failed!'))
                if result.get('error'):
                    self.stdout.write(f"Error: {result['error']}")
                raise CommandError('ETL Pipeline execution failed')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error running ETL pipeline: {str(e)}'))
            raise CommandError(f'ETL Pipeline error: {str(e)}')
