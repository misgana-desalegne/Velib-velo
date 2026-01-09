"""
Business logic for Arrondissement operations.
This service handles complex operations related to arrondissements.
"""
from django.utils import timezone
from datetime import timedelta
from ..models import Arrondissement, BikeStation, StationStatus, Trip


class ArrondissementService:
    """Service class for Arrondissement business logic"""
    
    @staticmethod
    def get_arrondissement_analytics(arrondissement):
        """
        Calculate detailed analytics for a specific arrondissement.
        
        Args:
            arrondissement: Arrondissement instance
            
        Returns:
            dict: Analytics data including stations, bikes, trips, etc.
        """
        # Get stations in this arrondissement
        stations = BikeStation.objects.filter(arrondissement=arrondissement)
        
        # Get latest status for all stations
        latest_statuses = StationStatus.objects.filter(
            station__in=stations
        ).order_by('station', '-timestamp').distinct('station')
        
        # Calculate totals
        total_bikes = sum(s.available_bikes for s in latest_statuses)
        total_docks = sum(s.available_docks for s in latest_statuses)
        avg_utilization = sum(s.utilization_rate for s in latest_statuses) / len(latest_statuses) if latest_statuses else 0
        
        # Get recent trips
        thirty_days_ago = timezone.now() - timedelta(days=30)
        trips_count = Trip.objects.filter(
            start_station__arrondissement=arrondissement,
            start_time__gte=thirty_days_ago
        ).count()
        
        return {
            'arr': arrondissement.code,
            'stations': stations.count(),
            'bikes': total_bikes,
            'docks': total_docks,
            'trips': trips_count,
            'utilization': round(avg_utilization, 2),
            'population': arrondissement.population,
        }
    
    @staticmethod
    def get_all_arrondissements_summary():
        """
        Get summary analytics for all arrondissements.
        
        Returns:
            list: List of analytics data for each arrondissement
        """
        arrondissements = Arrondissement.objects.all()
        results = []
        
        for arr in arrondissements:
            analytics = ArrondissementService.get_arrondissement_analytics(arr)
            results.append(analytics)
        
        return results
