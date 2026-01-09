from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArrondissementViewSet, BikeStationViewSet, StationStatusViewSet,
    TripViewSet, DailyAnalyticsViewSet, live_dashboard, arrondissement_summary
)
from .auth_views import RegisterView, LoginView, LogoutView, CurrentUserView

router = DefaultRouter()
router.register(r'arrondissements', ArrondissementViewSet)
router.register(r'stations', BikeStationViewSet)
router.register(r'status', StationStatusViewSet)
router.register(r'trips', TripViewSet)
router.register(r'analytics', DailyAnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/live/', live_dashboard, name='live-dashboard'),
    path('dashboard/arrondissements/', arrondissement_summary, name='arrondissement-summary'),
    
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),
]
