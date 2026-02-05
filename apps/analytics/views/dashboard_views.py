"""
Dashboard views/controllers.
Handles HTTP requests for dashboard endpoints and summary data.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Commune
from ..serializers import LiveDashboardSerializer, CommuneAnalyticsSerializer, CommuneSerializer
from ..services import AnalyticsService, CommuneService


@api_view(['GET'])
def live_dashboard(request):
    """
    Get live dashboard statistics.
    
    GET /api/dashboard/live/?commune_code=75056
    
    Query Parameters:
        commune_code: Optional INSEE commune code (e.g., '75056' for Paris)
    
    Returns:
        Response: Live dashboard data including stations, bikes, trips, etc.
    """
    commune_code = request.query_params.get('commune_code', None)
    data = AnalyticsService.get_live_dashboard_stats(commune_code=commune_code)
    serializer = LiveDashboardSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
def commune_list(request):
    """
    Get list of all communes for filtering.
    
    GET /api/dashboard/communes-list/
    
    Returns:
        Response: Simple list of communes with code and name
    """
    communes = Commune.objects.all().order_by('name')
    serializer = CommuneSerializer(communes, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def commune_summary(request):
    """
    Get summary analytics for all communes.
    
    GET /api/dashboard/communes/
    
    Returns:
        Response: List of analytics data for each commune
    """
    results = CommuneService.get_all_communes_summary()
    serializer = CommuneAnalyticsSerializer(results, many=True)
    return Response(serializer.data)
