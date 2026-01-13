"""
API views for advanced analytics insights.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from datetime import timedelta
from django.utils import timezone

from apps.analytics.models import DailyAnalytics, BikeStation
from apps.analytics.serializers import DailyAnalyticsSerializer
from apps.analytics.services.advanced_analytics_service import AdvancedAnalyticsService


class AnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for advanced analytics data"""
    queryset = DailyAnalytics.objects.all()
    serializer_class = DailyAnalyticsSerializer
    
    @action(detail=False, methods=['get'])
    def sources(self, request):
        """Get top SOURCE stations (supply bikes)"""
        days = int(request.query_params.get('days', 15))
        limit = int(request.query_params.get('limit', 10))
        
        results = AdvancedAnalyticsService.get_top_sources_and_sinks(days=days, limit=limit)
        return Response({
            'sources': results['sources'],
            'period_days': days,
        })
    
    @action(detail=False, methods=['get'])
    def sinks(self, request):
        """Get top SINK stations (demand bikes)"""
        days = int(request.query_params.get('days', 15))
        limit = int(request.query_params.get('limit', 10))
        
        results = AdvancedAnalyticsService.get_top_sources_and_sinks(days=days, limit=limit)
        return Response({
            'sinks': results['sinks'],
            'period_days': days,
        })
    
    @action(detail=False, methods=['get'])
    def ghost_stations(self, request):
        """Get GHOST stations (relocation candidates)"""
        days = int(request.query_params.get('days', 15))
        limit = int(request.query_params.get('limit', 20))
        
        ghost_stations = AdvancedAnalyticsService.get_ghost_stations(days=days, limit=limit)
        return Response({
            'ghost_stations': ghost_stations,
            'period_days': days,
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get analytics summary for entire network"""
        days = int(request.query_params.get('days', 15))
        since = timezone.now().date() - timedelta(days=days)
        
        analytics = DailyAnalytics.objects.filter(
            station__isnull=False,
            date__gte=since
        )
        
        summary = {
            'total_stations_tracked': BikeStation.objects.filter(is_active=True).count(),
            'total_analytics_records': analytics.count(),
            'period_days': days,
            'station_profiles': {
                'sources': BikeStation.objects.filter(profile='commuter_source').count(),
                'sinks': BikeStation.objects.filter(profile='commuter_sink').count(),
                'balanced': BikeStation.objects.filter(profile='balanced_hub').count(),
                'ghost': BikeStation.objects.filter(profile='ghost_station').count(),
            },
            'metrics_average': {
                'shannon_entropy': float(analytics.aggregate(Avg('shannon_entropy'))['shannon_entropy__avg'] or 0),
                'net_flux': float(analytics.aggregate(Avg('net_flux'))['net_flux__avg'] or 0),
                'average_hourly_delta': float(analytics.aggregate(Avg('average_hourly_delta'))['average_hourly_delta__avg'] or 0),
            },
            'network_health': {
                'stations_with_capacity_issues': analytics.filter(persistence_at_full__gte=8).values('station').distinct().count(),
                'stations_needing_rebalancing': analytics.filter(persistence_at_empty__gte=8).values('station').distinct().count(),
                'ghost_station_candidates': analytics.filter(is_ghost=True).values('station').distinct().count(),
            }
        }
        
        return Response(summary)


class StationProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for station profiles"""
    queryset = BikeStation.objects.filter(is_active=True)
    
    def get_serializer(self, *args, **kwargs):
        from rest_framework import serializers
        
        class StationProfileSerializer(serializers.ModelSerializer):
            profile_display = serializers.CharField(source='get_profile_display', read_only=True)
            latest_analytics = serializers.SerializerMethodField()
            
            class Meta:
                model = BikeStation
                fields = ['id', 'station_id', 'name', 'commune', 'profile', 
                         'profile_display', 'latitude', 'longitude', 'total_docks', 
                         'latest_analytics']
            
            def get_latest_analytics(self, obj):
                latest = DailyAnalytics.objects.filter(
                    station=obj,
                    date=timezone.now().date()
                ).first()
                
                if latest:
                    return {
                        'shannon_entropy': float(latest.shannon_entropy),
                        'net_flux': float(latest.net_flux),
                        'is_source': latest.is_source,
                        'is_sink': latest.is_sink,
                        'is_ghost': latest.is_ghost,
                    }
                return None
        
        return StationProfileSerializer(*args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_profile(self, request):
        """Get stations filtered by profile type"""
        profile = request.query_params.get('profile')
        
        if profile:
            stations = BikeStation.objects.filter(profile=profile, is_active=True)
        else:
            stations = BikeStation.objects.filter(is_active=True)
        
        serializer = self.get_serializer(stations, many=True)
        return Response(serializer.data)
