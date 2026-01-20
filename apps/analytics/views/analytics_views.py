"""
Analytics views/controllers.
Handles HTTP requests related to daily analytics and aggregated data.
"""
from rest_framework import viewsets
from django.utils import timezone
from datetime import timedelta

from ..models import DailyAnalytics
from ..serializers import DailyAnalyticsSerializer


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
        
        # Filter by date range (default last 30 days)
        days = int(self.request.query_params.get('days', 30))
        since = timezone.now().date() - timedelta(days=days)
        queryset = queryset.filter(date__gte=since)
        
        return queryset
