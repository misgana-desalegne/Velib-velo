"""
Backfill hourly analytics from StationStatus for the last N hours.

Usage:
    python manage.py backfill_hourly_analytics --hours 24
    python manage.py backfill_hourly_analytics --hours 48 --station-id 1234
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.analytics.models import BikeStation, HourlyAnalytics
from apps.analytics.services.advanced_analytics_service import AdvancedAnalyticsService


class Command(BaseCommand):
    help = 'Backfill HourlyAnalytics records from StationStatus for the last N hours'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Number of hours back from now (default: 24)'
        )
        parser.add_argument(
            '--station-id',
            type=str,
            help='Specific station code (optional, for testing)'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        station_id = options.get('station_id')

        end_time = timezone.now()
        start_time = end_time - timedelta(hours=hours)

        if station_id:
            stations = BikeStation.objects.filter(stationcode=station_id, is_installed=True)
        else:
            stations = BikeStation.objects.filter(is_installed=True)

        dates_to_process = set()
        current = start_time.date()
        while current <= end_time.date():
            dates_to_process.add(current)
            current += timedelta(days=1)

        total_stations = stations.count()
        self.stdout.write(self.style.SUCCESS(
            f"Backfilling hourly analytics from {start_time} to {end_time} for {total_stations} stations"
        ))

        total_records = 0
        errors = 0

        for date_val in sorted(dates_to_process):
            self.stdout.write(f"\nProcessing date {date_val}...")
            for idx, station in enumerate(stations):
                try:
                    with transaction.atomic():
                        hourly_records = AdvancedAnalyticsService.calculate_hourly_analytics(
                            station, date_val
                        )

                        for record in hourly_records:
                            HourlyAnalytics.objects.update_or_create(
                                timestamp=record['timestamp'],
                                station=station,
                                commune=None,
                                defaults={
                                    'date': record['date'],
                                    'hour': record['hour'],
                                    'average_utilization': record['average_utilization'],
                                    'bikes_available_avg': record['bikes_available_avg'],
                                    'docks_available_avg': record['docks_available_avg'],
                                    'hourly_delta': record['hourly_delta'],
                                    'data_points': record['data_points'],
                                }
                            )
                            total_records += 1

                    if (idx + 1) % 200 == 0:
                        self.stdout.write(
                            f"  {idx + 1}/{total_stations} stations processed (records: {total_records})"
                        )

                except Exception as exc:
                    errors += 1
                    self.stdout.write(self.style.ERROR(
                        f"Error processing station {station.stationcode} on {date_val}: {exc}"
                    ))

        self.stdout.write(self.style.SUCCESS("\nHourly analytics backfill complete"))
        self.stdout.write(f"Records written: {total_records}")
        self.stdout.write(f"Errors: {errors}")
