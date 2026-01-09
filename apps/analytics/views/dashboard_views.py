"""
Dashboard views/controllers.
Handles HTTP requests for dashboard endpoints and summary data.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..serializers import LiveDashboardSerializer, ArrondissementAnalyticsSerializer
from ..services import AnalyticsService, ArrondissementService


@api_view(['GET'])
def live_dashboard(request):
    """
    Get live dashboard statistics.
    
    GET /api/dashboard/live/
    
    Returns:
        Response: Live dashboard data including stations, bikes, trips, etc.
    """
    data = AnalyticsService.get_live_dashboard_stats()
    serializer = LiveDashboardSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
def arrondissement_summary(request):
    """
    Get summary analytics for all arrondissements.
    
    GET /api/dashboard/arrondissements/
    
    Returns:
        Response: List of analytics data for each arrondissement
    """
    results = ArrondissementService.get_all_arrondissements_summary()
    serializer = ArrondissementAnalyticsSerializer(results, many=True)
    return Response(serializer.data)
