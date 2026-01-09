"""
Arrondissement views/controllers.
Handles HTTP requests related to arrondissements.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Arrondissement
from ..serializers import ArrondissementSerializer, ArrondissementAnalyticsSerializer
from ..services import ArrondissementService


class ArrondissementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Arrondissement model.
    Provides CRUD operations and analytics for arrondissements.
    """
    queryset = Arrondissement.objects.all()
    serializer_class = ArrondissementSerializer
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        Get detailed analytics for a specific arrondissement.
        
        GET /api/arrondissements/{id}/analytics/
        """
        arrondissement = self.get_object()
        data = ArrondissementService.get_arrondissement_analytics(arrondissement)
        serializer = ArrondissementAnalyticsSerializer(data)
        return Response(serializer.data)
