"""
Commune views/controllers.
Handles HTTP requests related to communes.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Commune
from ..serializers import CommuneSerializer, CommuneAnalyticsSerializer
from ..services import CommuneService


class CommuneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Commune model.
    Provides CRUD operations and analytics for communes.
    """
    queryset = Commune.objects.all()
    serializer_class = CommuneSerializer
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        Get detailed analytics for a specific commune.
        
        GET /api/communes/{id}/analytics/
        """
        commune = self.get_object()
        data = CommuneService.get_commune_analytics(commune)
        serializer = CommuneAnalyticsSerializer(data)
        return Response(serializer.data)
