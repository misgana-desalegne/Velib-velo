"""
Views package - Controllers for the analytics application.
This package contains all view controllers organized by resource.
"""
from .arrondissement_views import CommuneViewSet
from .station_views import BikeStationViewSet, StationStatusViewSet
from .analytics_views import DailyAnalyticsViewSet
from .analytics_api_views import AnalyticsViewSet, StationProfileViewSet
from .dashboard_views import live_dashboard, commune_summary

__all__ = [
    'CommuneViewSet',
    'BikeStationViewSet',
    'StationStatusViewSet',
    'DailyAnalyticsViewSet',
    'AnalyticsViewSet',
    'StationProfileViewSet',
    'live_dashboard',
    'commune_summary',
]
