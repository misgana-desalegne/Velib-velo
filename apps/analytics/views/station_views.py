"""
BikeStation and StationStatus views/controllers.
Handles HTTP requests related to bike stations and their statuses.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import BikeStation, StationStatus
from ..serializers import BikeStationSerializer, StationStatusSerializer
from ..services import StationService


class BikeStationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for BikeStation model.
    Provides CRUD operations and status history for bike stations.
    """
    queryset = BikeStation.objects.select_related('arrondissement').all()
    serializer_class = BikeStationSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()
        arrondissement = self.request.query_params.get('arrondissement', None)
        
        if arrondissement:
            queryset = StationService.get_stations_by_arrondissement(arrondissement)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """
        Get status history for a specific station.
        
        GET /api/stations/{id}/status_history/?hours=24
        """
        station = self.get_object()
        hours = int(request.query_params.get('hours', 24))
        
        statuses = StationService.get_station_status_history(station, hours)
        serializer = StationStatusSerializer(statuses, many=True)
        return Response(serializer.data)


class StationStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StationStatus model.
    Provides CRUD operations for station status records.
    """
    queryset = StationStatus.objects.select_related('station').all()
    serializer_class = StationStatusSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()
        station_id = self.request.query_params.get('station', None)
        
        if station_id:
            queryset = queryset.filter(station__station_id=station_id)
        
        return queryset
