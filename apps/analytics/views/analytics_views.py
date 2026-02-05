"""
Analytics views/controllers.
Handles HTTP requests related to daily analytics and aggregated data.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, Sum

from ..models import DailyAnalytics, HourlyAnalytics, WeeklyAnalytics
from ..serializers import DailyAnalyticsSerializer, HourlyAnalyticsSerializer, WeeklyAnalyticsSerializer


class DailyAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for DailyAnalytics model (read-only).
    Provides access to aggregated daily analytics data.
    """
    queryset = DailyAnalytics.objects.select_related('commune', 'station').all()
    serializer_class = DailyAnalyticsSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by arrondissement and date range.
        """
        queryset = super().get_queryset()
        
        # Filter by arrondissement
        arrondissement = self.request.query_params.get('arrondissement', None)
        if arrondissement:
            queryset = queryset.filter(arrondissement__code=arrondissement)

        station_ids = self.request.query_params.get('station_ids', None)
        if station_ids:
            ids = [int(x) for x in station_ids.split(',') if x.isdigit()]
            if ids:
                queryset = queryset.filter(station_id__in=ids)
        
        # Filter by date range (default last 30 days)
        days = int(self.request.query_params.get('days', 30))
        since = timezone.now().date() - timedelta(days=days)
        queryset = queryset.filter(date__gte=since)
        
        return queryset


class HourlyAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for HourlyAnalytics model (read-only).
    Provides access to aggregated hourly analytics data.
    """
    queryset = HourlyAnalytics.objects.select_related('commune', 'station').all()
    serializer_class = HourlyAnalyticsSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        station_id = self.request.query_params.get('station_id', None)
        commune_code = self.request.query_params.get('commune_code', None)
        days = int(self.request.query_params.get('days', 1))
        since = timezone.now().date() - timedelta(days=days)

        if station_id:
            queryset = queryset.filter(station_id=station_id)

        if commune_code:
            queryset = queryset.filter(station__commune__code=commune_code)

        queryset = queryset.filter(date__gte=since)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Return 24h hourly summary aggregated across stations.

        Query params:
            commune_code (optional)
            days (optional, default 1)
        """
        commune_code = request.query_params.get('commune_code', None)
        days = int(request.query_params.get('days', 1))
        since = timezone.now().date() - timedelta(days=days)

        qs = HourlyAnalytics.objects.filter(date__gte=since)
        if commune_code:
            qs = qs.filter(station__commune__code=commune_code)

        hourly = qs.values('hour').annotate(
            bikes=Sum('bikes_available_avg'),
            docks=Sum('docks_available_avg')
        ).order_by('hour')

        hourly_map = {item['hour']: item for item in hourly}
        summary = []
        for hour in range(24):
            item = hourly_map.get(hour, {'bikes': 0, 'docks': 0})
            summary.append({
                'hour': f"{hour:02d}:00",
                'bikes': int(item['bikes'] or 0),
                'docks': int(item['docks'] or 0),
            })

        return Response(summary)


class WeeklyAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for WeeklyAnalytics model (read-only).
    Provides access to aggregated weekly analytics data.
    """
    queryset = WeeklyAnalytics.objects.select_related('commune', 'station').all()
    serializer_class = WeeklyAnalyticsSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        station_id = self.request.query_params.get('station_id', None)
        station_ids = self.request.query_params.get('station_ids', None)
        commune_code = self.request.query_params.get('commune_code', None)
        weeks = int(self.request.query_params.get('weeks', 12))
        since = timezone.now().date() - timedelta(weeks=weeks)

        if station_id:
            queryset = queryset.filter(station_id=station_id)

        if station_ids:
            ids = [int(x) for x in station_ids.split(',') if x.isdigit()]
            if ids:
                queryset = queryset.filter(station_id__in=ids)

        if commune_code:
            queryset = queryset.filter(station__commune__code=commune_code)

        queryset = queryset.filter(week_start_date__gte=since)
        return queryset
