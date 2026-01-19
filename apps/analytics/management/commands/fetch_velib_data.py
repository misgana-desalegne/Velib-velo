"""
Management command to fetch and sync Vélib data.

This command provides a quick way to fetch real-time data and sync to database.
For full ETL processing (with transformation), use: python manage.py run_etl_pipeline

Usage:
    python manage.py fetch_velib_data                    # Fetch all stations
    python manage.py fetch_velib_data --limit 100        # Fetch first 100 stations
"""

from django.core.management.base import BaseCommand
from apps.analytics.services.velib_data_ingestion import VelibDataIngestionService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetch real-time Vélib availability data from Paris Open Data API and sync to database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            help='Limit number of stations to fetch'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('Vélib Data Ingestion (Quick Fetch & Sync)'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
        
        limit = options.get('limit')
        
        try:
            # Use unified service for fetch and sync
            summary = VelibDataIngestionService.fetch_and_sync(limit)
            
            self.stdout.write(self.style.SUCCESS('\n✓ Data ingestion completed!'))
            self.stdout.write(f"  Stations created: {summary.get('stations_created', 0)}")
            self.stdout.write(f"  Stations updated: {summary.get('stations_updated', 0)}")
            self.stdout.write(f"  Status records: {summary.get('statuses_created', 0)}")
            
            if summary.get('errors'):
                self.stdout.write(self.style.WARNING(f"  Errors: {summary.get('errors', 0)}"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error during ingestion: {str(e)}'))
            logger.exception("Error in fetch_velib_data command")

            return
        
        # Calculate analytics if requested
        if options.get('calculate_analytics'):
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('Calculating Advanced Analytics'))
            self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
            
            today = timezone.now().date()
            stations = BikeStation.objects.filter(is_active=True)
            
            analytics_count = 0
            error_count = 0
            
            for station in stations:
                try:
                    analytics_data = AdvancedAnalyticsService.calculate_daily_analytics(
                        station, today
                    )
                    
                    if analytics_data:
                        daily, created = DailyAnalytics.objects.update_or_create(
                            date=today,
                            station=station,
                            commune=None,
                            defaults=analytics_data
                        )
                        
                        # Update station profile
                        if daily.is_ghost:
                            station.profile = 'ghost_station'
                        elif daily.is_source and daily.is_sink:
                            station.profile = 'balanced_hub'
                        elif daily.is_source:
                            station.profile = 'commuter_source'
                        elif daily.is_sink:
                            station.profile = 'commuter_sink'
                        
                        station.save()
                        analytics_count += 1
                        
                except Exception as e:
                    error_count += 1
                    self.stdout.write(self.style.ERROR(f"Error for {station.station_id}: {str(e)}"))
            
            self.stdout.write(self.style.SUCCESS(f'\n✓ Analytics calculated!'))
            self.stdout.write(f"  Records created: {analytics_count}")
            self.stdout.write(f"  Errors: {error_count}")
            
            # Show top sources and sinks
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('Station Classification Summary'))
            self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
            
            results = AdvancedAnalyticsService.get_top_sources_and_sinks(days=1, limit=5)
            
            self.stdout.write(self.style.WARNING('TOP SOURCES (Supply bikes):'))
            for i, source in enumerate(results['sources'], 1):
                self.stdout.write(
                    f"  {i}. {source['station__name']} ({source['station__station_id']})\n"
                    f"     Net Flux: {source['avg_net_flux']:.2f}"
                )
            
            self.stdout.write(self.style.WARNING('\nTOP SINKS (Demand bikes):'))
            for i, sink in enumerate(results['sinks'], 1):
                self.stdout.write(
                    f"  {i}. {sink['station__name']} ({sink['station__station_id']})\n"
                    f"     Net Flux: {sink['avg_net_flux']:.2f}"
                )
            
            ghost_stations = AdvancedAnalyticsService.get_ghost_stations(days=1, limit=5)
            if ghost_stations:
                self.stdout.write(self.style.WARNING('\nGHOST STATIONS (Relocation candidates):'))
                for i, ghost in enumerate(ghost_stations, 1):
                    self.stdout.write(
                        f"  {i}. {ghost['station__name']} ({ghost['station__station_id']})\n"
                        f"     Entropy: {ghost['avg_entropy']:.2f}"
                    )
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✓ All operations completed successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
