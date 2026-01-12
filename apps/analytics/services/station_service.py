"""
Business logic for BikeStation operations.
This service handles station-related business operations.
"""
from django.utils import timezone
from datetime import timedelta
from ..models import BikeStation, StationStatus


class StationService:
    """Service class for BikeStation business logic"""
    
    @staticmethod
    def get_station_status_history(station, hours=24):
        """
        Get status history for a specific station.
        
        Args:
            station: BikeStation instance
            hours: Number of hours to look back (default: 24)
            
        Returns:
            QuerySet: StationStatus objects for the given timeframe
        """
        since = timezone.now() - timedelta(hours=hours)
        return StationStatus.objects.filter(
            station=station,
            timestamp__gte=since
        ).order_by('-timestamp')
    
    @staticmethod
    def get_stations_by_arrondissement(arrondissement_code):
        """
        Get all stations in a specific arrondissement.
        
        Args:
            arrondissement_code: Code of the arrondissement
            
        Returns:
            QuerySet: BikeStation objects in the arrondissement
        """
        return BikeStation.objects.filter(
            arrondissement__code=arrondissement_code
        ).select_related('arrondissement')
    
    @staticmethod
    def get_latest_station_status(station):
        """
        Get the most recent status for a station.
        
        Args:
            station: BikeStation instance
            
        Returns:
            StationStatus or None: Latest status or None if no status exists
        """
        return station.statuses.first()
    
    @staticmethod
    def get_active_stations_with_status():
        """
        Get all active stations with their latest status.
        
        Returns:
            list: List of tuples (station, latest_status)
        """
        stations = BikeStation.objects.filter(is_active=True)
        result = []
        
        for station in stations:
            latest = StationService.get_latest_station_status(station)
            if latest:
                result.append((station, latest))
        
        return result
