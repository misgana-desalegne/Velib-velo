"""
Management command to populate database with sample data for testing
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from analytics.models import Arrondissement, BikeStation, StationStatus


class Command(BaseCommand):
    help = 'Populate database with sample bike sharing data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating sample data...')
        
        # Create Arrondissements
        arrondissements_data = [
            {'code': '1er', 'name': '1er Arrondissement', 'population': 16888},
            {'code': '2e', 'name': '2e Arrondissement', 'population': 21510},
            {'code': '3e', 'name': '3e Arrondissement', 'population': 34248},
            {'code': '4e', 'name': '4e Arrondissement', 'population': 27887},
            {'code': '5e', 'name': '5e Arrondissement', 'population': 58850},
            {'code': '6e', 'name': '6e Arrondissement', 'population': 41100},
            {'code': '7e', 'name': '7e Arrondissement', 'population': 51400},
            {'code': '8e', 'name': '8e Arrondissement', 'population': 37380},
            {'code': '9e', 'name': '9e Arrondissement', 'population': 59555},
            {'code': '10e', 'name': '10e Arrondissement', 'population': 83459},
            {'code': '11e', 'name': '11e Arrondissement', 'population': 144292},
            {'code': '12e', 'name': '12e Arrondissement', 'population': 139801},
        ]
        
        arrondissements = []
        for data in arrondissements_data:
            arr, created = Arrondissement.objects.get_or_create(
                code=data['code'],
                defaults={'name': data['name'], 'population': data['population']}
            )
            arrondissements.append(arr)
            if created:
                self.stdout.write(f'Created arrondissement: {arr.code}')
        
        # Create Bike Stations
        self.stdout.write('Creating bike stations...')
        stations = []
        station_counts = [45, 38, 52, 48, 55, 50, 58, 62, 54, 68, 72, 65]
        
        for i, arr in enumerate(arrondissements):
            for j in range(station_counts[i]):
                station_id = f"{arr.code}-{j+1:03d}"
                station, created = BikeStation.objects.get_or_create(
                    station_id=station_id,
                    defaults={
                        'name': f'Station {arr.code} - {j+1}',
                        'arrondissement': arr,
                        'latitude': 48.85 + random.uniform(-0.05, 0.05),
                        'longitude': 2.35 + random.uniform(-0.05, 0.05),
                        'total_docks': random.choice([15, 20, 25, 30]),
                        'is_active': True,
                    }
                )
                stations.append(station)
        
        self.stdout.write(f'Created {len(stations)} stations')
        
        # Create Station Status (last 24 hours)
        self.stdout.write('Creating station statuses...')
        now = timezone.now()
        
        for station in stations[:50]:  # Limit to first 50 stations for performance
            for hour in range(24):
                timestamp = now - timedelta(hours=hour)
                available_bikes = random.randint(0, station.total_docks)
                available_docks = station.total_docks - available_bikes
                
                StationStatus.objects.get_or_create(
                    station=station,
                    timestamp=timestamp,
                    defaults={
                        'available_bikes': available_bikes,
                        'available_docks': available_docks,
                        'is_operational': random.choice([True, True, True, False]),  # 75% operational
                    }
                )
        
        self.stdout.write('Creating sample trips...')
        # Create sample trips
        for _ in range(1000):
            start_station = random.choice(stations)
            end_station = random.choice([s for s in stations if s != start_station])
            
            start_time = now - timedelta(days=random.randint(0, 30), 
                                        hours=random.randint(0, 23),
                                        minutes=random.randint(0, 59))
            duration = random.randint(5, 120)
            end_time = start_time + timedelta(minutes=duration)
            
            trip_id = f"TRIP-{random.randint(100000, 999999)}"
            
            Trip.objects.get_or_create(
                trip_id=trip_id,
                defaults={
                    'start_station': start_station,
                    'end_station': end_station,
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration_minutes': duration,
                    'distance_km': random.uniform(0.5, 10.0),
                    'user_type': random.choice(['subscriber', 'customer']),
                }
            )
        
        self.stdout.write(self.style.SUCCESS('Successfully populated database with sample data!'))
