"""
Management command to calculate advanced analytics for all stations over a date range.

Usage:
    python manage.py calculate_advanced_analytics --start-date 2025-01-01 --end-date 2025-01-15
    python manage.py calculate_advanced_analytics --days 15  # Last 15 days
"""

from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.analytics.models import BikeStation, DailyAnalytics
from apps.analytics.services.advanced_analytics_service import AdvancedAnalyticsService


class Command(BaseCommand):
    help = 'Calculate advanced analytics (entropy, flux, profiles) for all stations'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=15,
            help='Number of days back from today (default: 15)'
        )
        parser.add_argument(
            '--station-id',
            type=str,
            help='Specific station ID (optional, for testing)'
        )
    
    def handle(self, *args, **options):
        # Parse dates
        if options['start_date']:
            start_date = datetime.strptime(options['start_date'], '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date() - timedelta(days=options['days'])
        
        if options['end_date']:
            end_date = datetime.strptime(options['end_date'], '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        self.stdout.write(f"Calculating analytics from {start_date} to {end_date}")
        
        # Get stations
        if options['station_id']:
            stations = BikeStation.objects.filter(station_id=options['station_id'])
        else:
            stations = BikeStation.objects.filter(is_active=True)
        
        total_stations = stations.count()
        self.stdout.write(f"Processing {total_stations} stations...")
        
        # Iterate through each station and date
        current_date = start_date
        total_records = 0
        error_count = 0
        
        while current_date <= end_date:
            self.stdout.write(f"\nProcessing {current_date}...")
            
            for idx, station in enumerate(stations):
                try:
                    with transaction.atomic():
                        analytics_data = AdvancedAnalyticsService.calculate_daily_analytics(
                            station, current_date
                        )
                        
                        if analytics_data:
                            # Update or create DailyAnalytics record
                            daily, created = DailyAnalytics.objects.update_or_create(
                                date=current_date,
                                station=station,
                                commune=None,
                                defaults=analytics_data
                            )
                            
                            # Also update station profile
                            if daily.is_ghost:
                                station.profile = 'ghost_station'
                            elif daily.is_source and daily.is_sink:
                                station.profile = 'balanced_hub'
                            elif daily.is_source:
                                station.profile = 'commuter_source'
                            elif daily.is_sink:
                                station.profile = 'commuter_sink'
                            
                            station.save()
                            
                            total_records += 1
                            
                            if (idx + 1) % 100 == 0:
                                self.stdout.write(
                                    f"  {idx + 1}/{total_stations} stations processed ({total_records} analytics created)"
                                )
                
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"Error processing {station.station_id}: {str(e)}")
                    )
            
            current_date += timedelta(days=1)
        
        # Print summary
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS(f"✓ Completed!"))
        self.stdout.write(f"Total records created: {total_records}")
        self.stdout.write(f"Errors: {error_count}")
        
        # Show top sources and sinks
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TOP SOURCES (Supply bikes):")
        results = AdvancedAnalyticsService.get_top_sources_and_sinks(
            days=(end_date - start_date).days, limit=10
        )
        
        for i, source in enumerate(results['sources'], 1):
            self.stdout.write(
                f"{i}. {source['station__name']} ({source['station__station_id']})\n"
                f"   Avg Net Flux: {source['avg_net_flux']:.2f} | "
                f"Entropy: {source['avg_entropy']:.2f} | "
                f"Days as Source: {source['days_as_source']}"
            )
        
        self.stdout.write("\nTOP SINKS (Demand bikes):")
        for i, sink in enumerate(results['sinks'], 1):
            self.stdout.write(
                f"{i}. {sink['station__name']} ({sink['station__station_id']})\n"
                f"   Avg Net Flux: {sink['avg_net_flux']:.2f} | "
                f"Entropy: {sink['avg_entropy']:.2f} | "
                f"Days as Sink: {sink['days_as_sink']}"
            )
        
        # Show ghost stations
        self.stdout.write("\n" + "="*60)
        self.stdout.write("GHOST STATIONS (Relocation candidates):")
        ghost_stations = AdvancedAnalyticsService.get_ghost_stations(
            days=(end_date - start_date).days, limit=10
        )
        
        for i, ghost in enumerate(ghost_stations, 1):
            self.stdout.write(
                f"{i}. {ghost['station__name']} ({ghost['station__station_id']})\n"
                f"   Avg Entropy: {ghost['avg_entropy']:.2f} | "
                f"Avg Turnover: {ghost['avg_daily_turnover']:.2f} | "
                f"Ghost Days: {ghost['ghost_occurrences']}"
            )
