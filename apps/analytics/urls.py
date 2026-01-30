from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommuneViewSet, BikeStationViewSet, StationStatusViewSet,
    DailyAnalyticsViewSet, HourlyAnalyticsViewSet, WeeklyAnalyticsViewSet, AnalyticsViewSet, StationProfileViewSet,
    live_dashboard, commune_summary, commune_list
)
from .auth_views import RegisterView, LoginView, LogoutView, CurrentUserView, ContactMessageView
from .api_views import TeamMemberListCreateView, TeamMemberDetailView

router = DefaultRouter()
router.register(r'communes', CommuneViewSet)
router.register(r'stations', BikeStationViewSet)
router.register(r'stations-profile', StationProfileViewSet, basename='station-profile')
router.register(r'status', StationStatusViewSet)
router.register(r'analytics', DailyAnalyticsViewSet)
router.register(r'hourly-analytics', HourlyAnalyticsViewSet)
router.register(r'weekly-analytics', WeeklyAnalyticsViewSet)
router.register(r'advanced-analytics', AnalyticsViewSet, basename='advanced-analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/live/', live_dashboard, name='live-dashboard'),
    path('dashboard/communes/', commune_summary, name='commune-summary'),
    path('dashboard/communes-list/', commune_list, name='communes-list'),
    
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),

    # Contact messages
    path('contact-messages/', ContactMessageView.as_view(), name='contact-messages'),
    # Team members API
    path('team-members/', TeamMemberListCreateView.as_view(), name='team-members-list'),
    path('team-members/<uuid:pk>/', TeamMemberDetailView.as_view(), name='team-members-detail'),
]
