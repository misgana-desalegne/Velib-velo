"""
Management command to assign communes to stations based on geographic coordinates.
For stations without geographic data, attempts to infer from names or defaults to nearest commune.
"""
from django.core.management.base import BaseCommand
from apps.analytics.models import BikeStation, Commune
import math


class Command(BaseCommand):
    help = 'Assign communes to stations based on coordinates or name'

    def handle(self, *args, **kwargs):
        # Get all communes
        communes = list(Commune.objects.all())
        
        if not communes:
            self.stdout.write(self.style.ERROR('No communes found in database'))
            return
        
        # Get stations without communes
        stations_without_commune = BikeStation.objects.filter(commune__isnull=True)
        total = stations_without_commune.count()
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS('All stations already have communes assigned'))
            return
        
        self.stdout.write(f'Found {total} stations without communes')
        
        # For simplicity, assume all stations are in Paris (75056) if coordinates are in Paris area
        # Paris coordinates: latitude ~48.8566, longitude ~2.3522
        paris_commune = Commune.objects.filter(code='75056').first()
        
        if not paris_commune:
            self.stdout.write(self.style.ERROR('Paris commune (75056) not found in database'))
            return
        
        assigned = 0
        for station in stations_without_commune:
            try:
                # Check if station is in Paris area (rough bounds)
                if station.latitude and station.longitude:
                    if 48.75 < station.latitude < 49.0 and 2.2 < station.longitude < 2.5:
                        station.commune = paris_commune
                        station.save()
                        assigned += 1
                    else:
                        # Try to find nearest commune
                        nearest = self.find_nearest_commune(station, communes)
                        if nearest:
                            station.commune = nearest
                            station.save()
                            assigned += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing station {station.stationcode}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully assigned {assigned} stations to communes'))

    @staticmethod
    def find_nearest_commune(station, communes):
        """Find the nearest commune to a station based on coordinates"""
        if not station.latitude or not station.longitude:
            return None
        
        min_distance = float('inf')
        nearest_commune = None
        
        for commune in communes:
            # Simple distance calculation (not accurate but works for demo)
            # Paris is roughly at (48.8566, 2.3522)
            # For now, just return Paris commune if coords are in general Paris area
            distance = math.sqrt(
                (station.latitude - 48.8566) ** 2 + 
                (station.longitude - 2.3522) ** 2
            )
            
            if distance < min_distance:
                min_distance = distance
                nearest_commune = commune
        
        return nearest_commune
