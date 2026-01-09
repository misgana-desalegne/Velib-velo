"""
Views package - Controllers for the analytics application.
This package contains all view controllers organized by resource.
"""
from .arrondissement_views import ArrondissementViewSet
from .station_views import BikeStationViewSet, StationStatusViewSet
from .trip_views import TripViewSet
from .analytics_views import DailyAnalyticsViewSet
from .dashboard_views import live_dashboard, arrondissement_summary

__all__ = [
    'ArrondissementViewSet',
    'BikeStationViewSet',
    'StationStatusViewSet',
    'TripViewSet',
    'DailyAnalyticsViewSet',
    'live_dashboard',
    'arrondissement_summary',
]
