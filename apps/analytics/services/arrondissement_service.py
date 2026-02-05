"""
Business logic for Commune operations.
This service handles complex operations related to communes.
"""
from django.utils import timezone
from datetime import timedelta
from django.db.models import Max, Avg
from ..models import Commune, BikeStation, StationStatus, DailyAnalytics, HourlyAnalytics
from .advanced_analytics_service import AdvancedAnalyticsService


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
        
        # Calculate average CV (Coefficient of Variation) from daily analytics
        # Try today first, then fall back to latest available date
        from django.db.models import Q
        today = timezone.now().date()
        
        avg_cv = 0
        # First try today's data
        daily_analytics = DailyAnalytics.objects.filter(
            station__commune=commune,
            date=today
        )
        
        # If no data for today, get the latest available date
        if not daily_analytics.exists():
            latest_date = DailyAnalytics.objects.filter(
                station__commune=commune
            ).values_list('date', flat=True).order_by('-date').first()
            
            if latest_date:
                daily_analytics = DailyAnalytics.objects.filter(
                    station__commune=commune,
                    date=latest_date
                )
        
        if daily_analytics.exists():
            cv_data = daily_analytics.aggregate(Avg('shannon_entropy'))
            avg_cv = round(cv_data['shannon_entropy__avg'] or 0, 2)

        # Fallback: compute CV from recent hourly analytics if daily CV is missing or zero
        if avg_cv == 0:
            since = timezone.now() - timedelta(hours=24)
            hourly_rows = HourlyAnalytics.objects.filter(
                station__commune=commune,
                timestamp__gte=since
            ).values('station_id', 'bikes_available_avg', 'data_points')

            station_series = {}
            for row in hourly_rows:
                if row['data_points'] and row['data_points'] > 0:
                    station_series.setdefault(row['station_id'], []).append(float(row['bikes_available_avg']))

            cv_values = []
            for series in station_series.values():
                cv_val = AdvancedAnalyticsService.calculate_coefficient_of_variation(series)
                if cv_val > 0:
                    cv_values.append(cv_val)

            if cv_values:
                avg_cv = round(sum(cv_values) / len(cv_values), 2)
        
        
        return {
            'code': commune.code,
            'name': commune.name,
            'stations': stations.count(),
            'bikes': total_bikes,
            'docks': total_docks,
            'capacity': total_capacity,
            'utilization': avg_utilization,
            'cv': avg_cv,
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
        
        # Sort by CV descending (highest CV first = most variable/dynamic)
        results.sort(key=lambda x: x['cv'], reverse=True)
        return results
