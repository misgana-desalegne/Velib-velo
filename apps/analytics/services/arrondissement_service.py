"""
Business logic for Commune operations.
This service handles complex operations related to communes.
"""
from django.utils import timezone
from datetime import timedelta
from ..models import Commune, BikeStation, StationStatus


class CommuneService:
    """Service class for Commune business logic"""
    
    @staticmethod
    def get_commune_analytics(commune):
        """
        Calculate detailed analytics for a specific commune.
        
        Args:
            commune: Commune instance
            
        Returns:
            dict: Analytics data including stations, bikes, etc.
        """
        # Get stations in this commune
        stations = BikeStation.objects.filter(commune=commune)
        
        # Get latest status for all stations
        latest_statuses = StationStatus.objects.filter(
            station__in=stations
        ).order_by('station', '-timestamp').distinct('station')
        
        # Calculate totals
        total_bikes = sum(s.available_bikes for s in latest_statuses)
        total_docks = sum(s.available_docks for s in latest_statuses)
        avg_utilization = sum(s.utilization_rate for s in latest_statuses) / len(latest_statuses) if latest_statuses else 0
        
        return {
            'code': commune.code,
            'stations': stations.count(),
            'bikes': total_bikes,
            'docks': total_docks,
            'utilization': round(avg_utilization, 2),
            'population': commune.population,
        }
    
    @staticmethod
    def get_all_communes_summary():
        """
        Get summary analytics for all communes.
        
        Returns:
            list: List of analytics data for each commune
        """
        communes = Commune.objects.all()
        results = []
        
        for commune in communes:
            analytics = CommuneService.get_commune_analytics(commune)
            results.append(analytics)
        
        return results
