from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArrondissementViewSet, BikeStationViewSet, StationStatusViewSet,
    TripViewSet, DailyAnalyticsViewSet, live_dashboard, arrondissement_summary,
    velib_realtime,
)
from .auth_views import RegisterView, LoginView, LogoutView, CurrentUserView
from .social_auth_views import GoogleLoginView, FacebookLoginView

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

    # Velib Open Data (realtime)
    path('velib/realtime/', velib_realtime, name='velib-realtime'),
    
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/google/', GoogleLoginView.as_view(), name='auth-google'),
    path('auth/facebook/', FacebookLoginView.as_view(), name='auth-facebook'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),
]
