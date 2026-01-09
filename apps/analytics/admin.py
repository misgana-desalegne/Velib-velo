from django.contrib import admin
from .models import Arrondissement, BikeStation, StationStatus, Trip, DailyAnalytics


@admin.register(Arrondissement)
class ArrondissementAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'population', 'area_km2']
    search_fields = ['code', 'name']


@admin.register(BikeStation)
class BikeStationAdmin(admin.ModelAdmin):
    list_display = ['station_id', 'name', 'arrondissement', 'total_docks', 'is_active']
    list_filter = ['is_active', 'arrondissement']
    search_fields = ['station_id', 'name']


@admin.register(StationStatus)
class StationStatusAdmin(admin.ModelAdmin):
    list_display = ['station', 'timestamp', 'available_bikes', 'available_docks', 'is_operational']
    list_filter = ['is_operational', 'timestamp']
    date_hierarchy = 'timestamp'


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['trip_id', 'start_station', 'end_station', 'start_time', 'duration_minutes', 'user_type']
    list_filter = ['user_type', 'start_time']
    date_hierarchy = 'start_time'
    search_fields = ['trip_id']


@admin.register(DailyAnalytics)
class DailyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['date', 'arrondissement', 'station', 'total_trips', 'average_utilization']
    list_filter = ['date', 'arrondissement']
    date_hierarchy = 'date'
