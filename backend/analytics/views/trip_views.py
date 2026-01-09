"""
Trip views/controllers.
Handles HTTP requests related to bike trips.
"""
from rest_framework import viewsets

from ..models import Trip
from ..serializers import TripSerializer
from ..services import AnalyticsService


class TripViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Trip model.
    Provides CRUD operations and filtering for bike trips.
    """
    queryset = Trip.objects.select_related('start_station', 'end_station').all()
    serializer_class = TripSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by date range.
        """
        # Get date range from query parameters
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        # Use service to get filtered trips
        return AnalyticsService.get_trips_in_date_range(start_date, end_date)
