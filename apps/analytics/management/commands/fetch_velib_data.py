"""
Management command to fetch and sync Vélib data.

This command provides a quick way to fetch real-time data and sync to database.
For full ETL processing (with transformation), use: python manage.py run_etl_pipeline

Usage:
    python manage.py fetch_velib_data                    # Fetch all stations
    python manage.py fetch_velib_data --limit 100        # Fetch first 100 stations
"""

from django.core.management.base import BaseCommand
from apps.analytics.services import DataExtractor, DataCleaner, DataTransformer, CommuneLoader, BikeStationLoader, StationStatusLoader
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
            # Extract: Get raw data from API
            self.stdout.write("\n  1. Extracting data from API...")
            extractor = DataExtractor()
            records = extractor.extract(limit)
            
            if not records:
                self.stdout.write(self.style.ERROR('  ✗ No records fetched from API'))
                return
            
            self.stdout.write(f"  ✓ Extracted {len(records)} station records")
            
            # Transform: Parse and clean data
            self.stdout.write("\n  2. Transforming data...")
            cleaner = DataCleaner()
            df_clean = cleaner.clean_station_records(records)
            # Note: DataTransformer only has static methods for aggregation, not needed for raw data loading
            df_transformed = df_clean
            self.stdout.write(f"  ✓ Transformed {len(df_transformed)} records")
            
            # Load: Store in database
            self.stdout.write("\n  3. Loading data into database...")
            commune_loader = CommuneLoader()
            station_loader = BikeStationLoader()
            status_loader = StationStatusLoader()
            
            communes_dict = commune_loader.load_communes(df_transformed)
            self.stdout.write("  ✓ Communes synced")
            
            station_ids = station_loader.load_stations(df_transformed, communes_dict)
            self.stdout.write(f"  ✓ Stations synced ({len(station_ids)} records)")
            
            status_count = status_loader.load_statuses(df_transformed, station_ids)
            self.stdout.write(f"  ✓ Status snapshots created ({status_count} records)")
            
            self.stdout.write(self.style.SUCCESS('\n✓ Data ingestion completed!'))
            
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
