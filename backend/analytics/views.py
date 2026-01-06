from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, F
from django.utils import timezone
from datetime import timedelta

from .models import Arrondissement, BikeStation, StationStatus, Trip, DailyAnalytics
from .serializers import (
    ArrondissementSerializer, BikeStationSerializer, StationStatusSerializer,
    TripSerializer, DailyAnalyticsSerializer, ArrondissementAnalyticsSerializer,
    LiveDashboardSerializer
)


class ArrondissementViewSet(viewsets.ModelViewSet):
    """ViewSet for Arrondissement model"""
    queryset = Arrondissement.objects.all()
    serializer_class = ArrondissementSerializer
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get detailed analytics for a specific arrondissement"""
        arrondissement = self.get_object()
        
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
        
        data = {
            'arr': arrondissement.code,
            'stations': stations.count(),
            'bikes': total_bikes,
            'docks': total_docks,
            'trips': trips_count,
            'utilization': round(avg_utilization, 2),
            'population': arrondissement.population,
        }
        
        serializer = ArrondissementAnalyticsSerializer(data)
        return Response(serializer.data)


class BikeStationViewSet(viewsets.ModelViewSet):
    """ViewSet for BikeStation model"""
    queryset = BikeStation.objects.select_related('arrondissement').all()
    serializer_class = BikeStationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        arrondissement = self.request.query_params.get('arrondissement', None)
        if arrondissement:
            queryset = queryset.filter(arrondissement__code=arrondissement)
        return queryset
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """Get status history for a station"""
        station = self.get_object()
        hours = int(request.query_params.get('hours', 24))
        
        since = timezone.now() - timedelta(hours=hours)
        statuses = StationStatus.objects.filter(
            station=station,
            timestamp__gte=since
        ).order_by('-timestamp')
        
        serializer = StationStatusSerializer(statuses, many=True)
        return Response(serializer.data)


class StationStatusViewSet(viewsets.ModelViewSet):
    """ViewSet for StationStatus model"""
    queryset = StationStatus.objects.select_related('station').all()
    serializer_class = StationStatusSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        station_id = self.request.query_params.get('station', None)
        if station_id:
            queryset = queryset.filter(station__station_id=station_id)
        return queryset


class TripViewSet(viewsets.ModelViewSet):
    """ViewSet for Trip model"""
    queryset = Trip.objects.select_related('start_station', 'end_station').all()
    serializer_class = TripSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date)
        
        return queryset


class DailyAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for DailyAnalytics model (read-only)"""
    queryset = DailyAnalytics.objects.select_related('arrondissement', 'station').all()
    serializer_class = DailyAnalyticsSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        arrondissement = self.request.query_params.get('arrondissement', None)
        if arrondissement:
            queryset = queryset.filter(arrondissement__code=arrondissement)
        
        days = int(self.request.query_params.get('days', 30))
        since = timezone.now().date() - timedelta(days=days)
        queryset = queryset.filter(date__gte=since)
        
        return queryset


@api_view(['GET'])
def live_dashboard(request):
    """Get live dashboard statistics"""
    
    # Get all stations
    total_stations = BikeStation.objects.count()
    active_stations = BikeStation.objects.filter(is_active=True).count()
    
    # Get latest status for all stations
    latest_statuses = []
    for station in BikeStation.objects.filter(is_active=True):
        latest = station.statuses.first()
        if latest:
            latest_statuses.append(latest)
    
    total_bikes = sum(s.available_bikes for s in latest_statuses)
    total_docks = sum(s.available_docks for s in latest_statuses)
    avg_utilization = sum(s.utilization_rate for s in latest_statuses) / len(latest_statuses) if latest_statuses else 0
    
    # Get trips in last hour
    one_hour_ago = timezone.now() - timedelta(hours=1)
    current_trips = Trip.objects.filter(start_time__gte=one_hour_ago).count()
    
    data = {
        'total_stations': total_stations,
        'active_stations': active_stations,
        'total_bikes': total_bikes,
        'total_docks': total_docks,
        'current_trips': current_trips,
        'avg_utilization': round(avg_utilization, 2),
    }
    
    serializer = LiveDashboardSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
def arrondissement_summary(request):
    """Get summary analytics for all arrondissements"""
    
    arrondissements = Arrondissement.objects.all()
    results = []
    
    for arr in arrondissements:
        stations = BikeStation.objects.filter(arrondissement=arr)
        
        # Get latest status for stations in this arrondissement
        latest_statuses = []
        for station in stations:
            latest = station.statuses.first()
            if latest:
                latest_statuses.append(latest)
        
        total_bikes = sum(s.available_bikes for s in latest_statuses)
        total_docks = sum(s.available_docks for s in latest_statuses)
        avg_utilization = sum(s.utilization_rate for s in latest_statuses) / len(latest_statuses) if latest_statuses else 0
        
        # Get trips in last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        trips_count = Trip.objects.filter(
            start_station__arrondissement=arr,
            start_time__gte=thirty_days_ago
        ).count()
        
        results.append({
            'arr': arr.code,
            'stations': stations.count(),
            'bikes': total_bikes,
            'docks': total_docks,
            'trips': trips_count,
            'utilization': round(avg_utilization, 2),
            'population': arr.population,
        })
    
    serializer = ArrondissementAnalyticsSerializer(results, many=True)
    return Response(serializer.data)
