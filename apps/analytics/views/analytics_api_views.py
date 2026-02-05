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
    """ViewSet for advanced analytics data - optimized with select_related"""
    serializer_class = DailyAnalyticsSerializer
    
    def get_queryset(self):
        """Optimize queries with select_related to prevent N+1 queries"""
        return DailyAnalytics.objects.select_related(
            'station',
            'commune'
        ).all()
    
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
        """Get analytics summary for entire network - optimized queries"""
        days = int(request.query_params.get('days', 15))
        since = timezone.now().date() - timedelta(days=days)
        
        # Optimized: Use aggregations instead of separate queries
        analytics = DailyAnalytics.objects.filter(
            station__isnull=False,
            date__gte=since
        ).select_related('station', 'commune')
        
        # Aggregate all profile counts in one query
        profile_counts = BikeStation.objects.aggregate(
            sources=Count('id', filter=Q(profile='commuter_source')),
            sinks=Count('id', filter=Q(profile='commuter_sink')),
            balanced=Count('id', filter=Q(profile='balanced_hub')),
            ghost=Count('id', filter=Q(profile='ghost_station')),
            active=Count('id', filter=Q(is_installed=True))
        )
        
        # Aggregate all metrics in one query
        metrics = analytics.aggregate(
            shannon_entropy_avg=Avg('shannon_entropy'),
            net_flux_avg=Avg('net_flux'),
            hourly_delta_avg=Avg('average_hourly_delta'),
            capacity_issues=Count('id', filter=Q(persistence_at_full__gte=8)),
            rebalance_needed=Count('id', filter=Q(persistence_at_empty__gte=8)),
            ghost_candidates=Count('id', filter=Q(is_ghost=True))
        )
        
        summary = {
            'total_stations_tracked': profile_counts['active'],
            'total_analytics_records': analytics.count(),
            'period_days': days,
            'station_profiles': {
                'sources': profile_counts['sources'],
                'sinks': profile_counts['sinks'],
                'balanced': profile_counts['balanced'],
                'ghost': profile_counts['ghost'],
            },
            'metrics_average': {
                'shannon_entropy': float(metrics['shannon_entropy_avg'] or 0),
                'net_flux': float(metrics['net_flux_avg'] or 0),
                'average_hourly_delta': float(metrics['hourly_delta_avg'] or 0),
            },
            'network_health': {
                'stations_with_capacity_issues': metrics['capacity_issues'],
                'stations_needing_rebalancing': metrics['rebalance_needed'],
                'ghost_station_candidates': metrics['ghost_candidates'],
            }
        }
        
        return Response(summary)


class StationProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for station profiles"""
    queryset = BikeStation.objects.filter(is_installed=True)
    
    def get_serializer(self, *args, **kwargs):
        from rest_framework import serializers
        
        class StationProfileSerializer(serializers.ModelSerializer):
            profile_display = serializers.CharField(source='get_profile_display', read_only=True)
            latest_analytics = serializers.SerializerMethodField()
            
            class Meta:
                model = BikeStation
                fields = ['id', 'stationcode', 'name', 'commune', 'profile', 
                         'profile_display', 'latitude', 'longitude', 'capacity', 
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
            stations = BikeStation.objects.filter(profile=profile, is_installed=True)
        else:
            stations = BikeStation.objects.filter(is_installed=True)
        
        serializer = self.get_serializer(stations, many=True)
        return Response(serializer.data)
