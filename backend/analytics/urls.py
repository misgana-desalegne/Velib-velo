from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'arrondissements', views.ArrondissementViewSet)
router.register(r'stations', views.BikeStationViewSet)
router.register(r'status', views.StationStatusViewSet)
router.register(r'trips', views.TripViewSet)
router.register(r'analytics', views.DailyAnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/live/', views.live_dashboard, name='live-dashboard'),
    path('dashboard/arrondissements/', views.arrondissement_summary, name='arrondissement-summary'),
]
