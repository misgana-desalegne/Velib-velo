"""
Business logic for Commune operations.
This service handles complex operations related to communes.
"""
from django.utils import timezone
from datetime import timedelta
from django.db.models import Max, Avg
from ..models import Commune, BikeStation, StationStatus, DailyAnalytics


class CommuneService:
    """Service class for Commune business logic"""
    
    @staticmethod
    def get_commune_analytics(commune):
        """
        Calculate detailed analytics for a specific commune.
        
        Args:
            commune: Commune instance
            
        Returns:
            dict: Analytics data including stations, bikes, entropy, etc.
        """
        # Get stations in this commune
        stations = BikeStation.objects.filter(commune=commune)
        station_ids = stations.values_list('id', flat=True)
        
        # Get latest status for each station
        latest_statuses = StationStatus.objects.filter(
            station__in=station_ids
        ).values('station').annotate(
            latest_timestamp=Max('timestamp')
        )
        
        latest_status_records = []
        total_bikes = 0
        total_docks = 0
        total_capacity = 0
        
        for status_info in latest_statuses:
            latest = StationStatus.objects.get(
                station_id=status_info['station'],
                timestamp=status_info['latest_timestamp']
            )
            latest_status_records.append(latest)
            total_bikes += latest.available_bikes
            total_docks += latest.available_docks
            station = latest.station
            if station.capacity:
                total_capacity += station.capacity
        
        # Calculate average utilization (bikes / capacity)
        # Utilization = available_bikes / (available_bikes + available_docks)
        avg_utilization = 0
        if total_bikes + total_docks > 0:
            # Use actual available spots as denominator for more accurate calculation
            # This prevents >100% when capacity data is stale or incorrect
            avg_utilization = round((total_bikes / (total_bikes + total_docks)) * 100, 2)
        elif total_capacity > 0:
            # Fallback to capacity-based calculation if no dock data available
            avg_utilization = round(min((total_bikes / total_capacity) * 100, 100), 2)
        
        # Calculate average entropy from daily analytics
        today = timezone.now().date()
        daily_analytics = DailyAnalytics.objects.filter(
            station__commune=commune,
            date=today
        )
        
        avg_entropy = 0
        if daily_analytics.exists():
            entropy_data = daily_analytics.aggregate(Avg('shannon_entropy'))
            avg_entropy = round(entropy_data['shannon_entropy__avg'] or 0, 2)
        
        return {
            'code': commune.code,
            'name': commune.name,
            'stations': stations.count(),
            'bikes': total_bikes,
            'docks': total_docks,
            'capacity': total_capacity,
            'utilization': avg_utilization,
            'entropy': avg_entropy,
            'population': commune.population,
        }
    
    @staticmethod
    def get_all_communes_summary():
        """
        Get summary analytics for all communes, sorted by entropy.
        
        Returns:
            list: List of analytics data for each commune
        """
        communes = Commune.objects.filter(stations__isnull=False).distinct()
        results = []
        
        for commune in communes:
            analytics = CommuneService.get_commune_analytics(commune)
            if analytics['stations'] > 0:  # Only include communes with stations
                results.append(analytics)
        
        # Sort by entropy descending (highest entropy first = most dynamic/unpredictable)
        results.sort(key=lambda x: x['entropy'], reverse=True)
        return results
