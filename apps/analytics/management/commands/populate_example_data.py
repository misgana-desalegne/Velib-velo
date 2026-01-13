from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from apps.analytics.models import Arrondissement, BikeStation, StationStatus
import random


class Command(BaseCommand):
    help = 'Populate database with example data from frontend'

    def handle(self, *args, **options):
        # Clear existing data
        self.stdout.write('Clearing existing data...')
        Trip.objects.all().delete()
        StationStatus.objects.all().delete()
        BikeStation.objects.all().delete()
        Arrondissement.objects.all().delete()

        # Create arrondissements
        self.stdout.write('Creating arrondissements...')
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
            {'code': '18e', 'name': '18e Arrondissement', 'population': 200000},
        ]
        
        arrondissements = {}
        for data in arrondissements_data:
            arr = Arrondissement.objects.create(**data)
            arrondissements[data['code']] = arr

        # Create stations from MapAnalysis data
        self.stdout.write('Creating stations...')
        stations_data = [
            {'id': 1, 'name': 'Gare du Nord', 'lat': 48.8809, 'lng': 2.3553, 'bikes': 42, 'docks': 8, 'capacity': 50, 'arr': '10e'},
            {'id': 2, 'name': 'Champs-Élysées', 'lat': 48.8698, 'lng': 2.3078, 'bikes': 38, 'docks': 12, 'capacity': 50, 'arr': '8e'},
            {'id': 3, 'name': 'Bastille', 'lat': 48.8531, 'lng': 2.3694, 'bikes': 5, 'docks': 35, 'capacity': 40, 'arr': '11e'},
            {'id': 4, 'name': 'Luxembourg', 'lat': 48.8462, 'lng': 2.3372, 'bikes': 28, 'docks': 22, 'capacity': 50, 'arr': '6e'},
            {'id': 5, 'name': 'République', 'lat': 48.8676, 'lng': 2.3634, 'bikes': 7, 'docks': 33, 'capacity': 40, 'arr': '3e'},
            {'id': 6, 'name': 'Tour Eiffel', 'lat': 48.8584, 'lng': 2.2945, 'bikes': 32, 'docks': 18, 'capacity': 50, 'arr': '7e'},
            {'id': 7, 'name': 'Louvre', 'lat': 48.8606, 'lng': 2.3376, 'bikes': 15, 'docks': 25, 'capacity': 40, 'arr': '1er'},
            {'id': 8, 'name': 'Notre-Dame', 'lat': 48.8530, 'lng': 2.3499, 'bikes': 9, 'docks': 31, 'capacity': 40, 'arr': '4e'},
            {'id': 9, 'name': 'Montmartre', 'lat': 48.8867, 'lng': 2.3431, 'bikes': 41, 'docks': 9, 'capacity': 50, 'arr': '18e'},
            {'id': 10, 'name': 'Saint-Germain', 'lat': 48.8534, 'lng': 2.3330, 'bikes': 24, 'docks': 16, 'capacity': 40, 'arr': '6e'},
            {'id': 11, 'name': 'Opéra', 'lat': 48.8719, 'lng': 2.3316, 'bikes': 36, 'docks': 14, 'capacity': 50, 'arr': '9e'},
            {'id': 12, 'name': 'Châtelet', 'lat': 48.8583, 'lng': 2.3470, 'bikes': 3, 'docks': 47, 'capacity': 50, 'arr': '1er'},
        ]

        stations = {}
        for data in stations_data:
            station = BikeStation.objects.create(
                station_id=f"STATION_{data['id']}",
                name=data['name'],
                arrondissement=arrondissements[data['arr']],
                latitude=data['lat'],
                longitude=data['lng'],
                total_docks=data['capacity'],
            )
            stations[data['id']] = station
            
            # Create initial status
            StationStatus.objects.create(
                station=station,
                available_bikes=data['bikes'],
                available_docks=data['docks'],
                is_operational=True,
            )

        # Create sample trips
        self.stdout.write('Creating sample trips...')
        station_ids = list(stations.keys())
        trip_counter = 0
        
        # Create trips for the last 30 days
        for day_offset in range(30):
            date = timezone.now() - timedelta(days=day_offset)
            # Generate trips for different times of day
            for trip_hour in [7, 9, 12, 14, 17, 19, 21]:
                for _ in range(random.randint(2, 8)):
                    start_station = stations[random.choice(station_ids)]
                    end_station = stations[random.choice(station_ids)]
                    
                    duration = random.randint(5, 45)
                    start_time = date.replace(hour=trip_hour, minute=random.randint(0, 59))
                    end_time = start_time + timedelta(minutes=duration)
                    
                    Trip.objects.create(
                        trip_id=f"TRIP_{date.date()}_{trip_counter}",
                        start_station=start_station,
                        end_station=end_station,
                        start_time=start_time,
                        end_time=end_time,
                        duration_minutes=duration,
                        distance_km=round(random.uniform(0.5, 8.0), 2),
                        user_type=random.choice(['subscriber', 'customer']),
                    )
                    trip_counter += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully populated database with example data!'))
        self.stdout.write(f'Created {len(arrondissements)} arrondissements')
        self.stdout.write(f'Created {len(stations)} stations')
        self.stdout.write(f'Created {trip_counter} trips')
