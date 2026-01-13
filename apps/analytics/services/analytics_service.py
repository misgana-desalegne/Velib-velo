"""
Business logic for Dashboard and Analytics operations.
This service handles dashboard statistics and analytics computations.
"""
from django.utils import timezone
from datetime import timedelta
from ..models import BikeStation
from .station_service import StationService


class AnalyticsService:
    """Service class for Analytics and Dashboard business logic"""
    
    @staticmethod
    def get_live_dashboard_stats():
        """
        Calculate live dashboard statistics.
        
        Returns:
            dict: Dashboard statistics including stations, bikes, trips, etc.
        """
        # Get all stations count
        total_stations = BikeStation.objects.count()
        active_stations = BikeStation.objects.filter(is_active=True).count()
        
        # Get latest status for all active stations
        stations_with_status = StationService.get_active_stations_with_status()
        latest_statuses = [status for _, status in stations_with_status]
        
        total_bikes = sum(s.available_bikes for s in latest_statuses)
        total_docks = sum(s.available_docks for s in latest_statuses)
        avg_utilization = sum(s.utilization_rate for s in latest_statuses) / len(latest_statuses) if latest_statuses else 0
        
        # Get trips in last hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        current_trips = Trip.objects.filter(start_time__gte=one_hour_ago).count()
        
        return {
            'total_stations': total_stations,
            'active_stations': active_stations,
            'total_bikes': total_bikes,
            'total_docks': total_docks,
            'current_trips': current_trips,
            'avg_utilization': round(avg_utilization, 2),
        }
    
    @staticmethod
    def get_trips_in_date_range(start_date=None, end_date=None):
        """
        Get trips within a date range.
        
        Args:
            start_date: Starting date (optional)
            end_date: Ending date (optional)
            
        Returns:
            QuerySet: Filtered Trip objects
        """
        queryset = Trip.objects.select_related('start_station', 'end_station').all()
        
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date)
        
        return queryset
