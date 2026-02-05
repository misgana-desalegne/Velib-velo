"""
Business logic for Dashboard and Analytics operations.
This service handles dashboard statistics and analytics computations.
"""
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Avg, Count, QuerySet
from ..models import BikeStation, StationStatus


class AnalyticsService:
    """Service class for Analytics and Dashboard business logic"""
    
    @staticmethod
    def get_live_dashboard_stats(commune_code=None):
        """
        Calculate live dashboard statistics.
        
        Args:
            commune_code: Optional commune code to filter by (e.g., '75056' for Paris)
        
        Returns:
            dict: Dashboard statistics including stations, bikes, docks, etc.
        """
        # Get stations based on commune filter
        if commune_code:
            stations = BikeStation.objects.filter(commune__code=commune_code)
        else:
            stations = BikeStation.objects.all()
        
        # Get all stations count
        total_stations = stations.count()
        active_stations = stations.filter(is_installed=True).count()
        
        # Get latest status for each station (most recent record)
        from django.db.models import Max, F
        
        latest_statuses = StationStatus.objects.filter(
            station__in=stations,
            station__is_installed=True
        ).values('station').annotate(
            max_timestamp=Max('timestamp')
        ).values_list('station', flat=True)
        
        latest_status_records = StationStatus.objects.filter(
            station__in=latest_statuses,
            station__is_installed=True
        ).select_related('station')
        
        # Calculate totals
        total_bikes = 0
        total_docks = 0
        total_utilization = 0
        utilization_count = 0
        
        for status in latest_status_records:
            total_bikes += status.available_bikes
            total_docks += status.available_docks
            capacity = status.station.capacity if status.station.capacity > 0 else 1
            util = (status.available_bikes / capacity) * 100
            total_utilization += util
            utilization_count += 1
        
        avg_utilization = total_utilization / utilization_count if utilization_count > 0 else 0
        
        return {
            'total_stations': total_stations,
            'active_stations': active_stations,
            'total_bikes': int(total_bikes),
            'total_docks': int(total_docks),
            'avg_utilization': round(avg_utilization / 100, 2),  # Return as decimal (0.0-1.0)
        }
    
    @staticmethod
    def get_trips_in_date_range(start_date=None, end_date=None):
        """
        Get trips within a date range.
        
        DEPRECATED: Trip model no longer exists.
        Returns empty QuerySet for backward compatibility.
        
        Args:
            start_date: Starting date (optional)
            end_date: Ending date (optional)
            
        Returns:
            QuerySet: Empty (Trip model deprecated)
        """
        # Trip model has been deprecated and removed
        # This method returns empty for backward compatibility
        return QuerySet()
