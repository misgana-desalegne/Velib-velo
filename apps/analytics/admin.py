from django.contrib import admin
from .models import Commune, BikeStation, StationStatus, DailyAnalytics, WeeklyAnalytics, ContactMessage, TeamMember


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'population', 'area_km2']
    search_fields = ['code', 'name']


@admin.register(BikeStation)
class BikeStationAdmin(admin.ModelAdmin):
    list_display = ['stationcode', 'name', 'commune', 'profile', 'capacity', 'is_installed']
    list_filter = ['is_installed', 'profile', 'commune']
    search_fields = ['stationcode', 'name']


@admin.register(StationStatus)
class StationStatusAdmin(admin.ModelAdmin):
    list_display = ['station', 'timestamp', 'available_bikes', 'available_docks', 'is_operational']
    list_filter = ['is_operational', 'timestamp']
    date_hierarchy = 'timestamp'


@admin.register(DailyAnalytics)
class DailyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['date', 'commune', 'station', 'shannon_entropy', 'net_flux', 'is_source', 'is_sink', 'is_ghost']
    list_filter = ['date', 'commune', 'is_source', 'is_sink', 'is_ghost']
    date_hierarchy = 'date'
    readonly_fields = ['shannon_entropy', 'net_flux', 'average_hourly_delta', 'persistence_at_full', 'persistence_at_empty']


@admin.register(WeeklyAnalytics)
class WeeklyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['week_start_date', 'week_end_date', 'commune', 'station', 'shannon_entropy', 'net_flux', 'is_source', 'is_sink', 'is_ghost']
    list_filter = ['week_start_date', 'commune', 'is_source', 'is_sink', 'is_ghost']
    date_hierarchy = 'week_start_date'
    readonly_fields = ['shannon_entropy', 'net_flux', 'average_hourly_delta', 'persistence_at_full', 'persistence_at_empty', 'operational_hours']
    fieldsets = (
        ('Period', {
            'fields': ('week_start_date', 'week_end_date')
        }),
        ('Location', {
            'fields': ('commune', 'station')
        }),
        ('Basic Metrics', {
            'fields': ('total_trips', 'total_duration_minutes', 'average_duration_minutes', 'average_utilization', 'peak_day', 'peak_hour')
        }),
        ('Signal Analysis', {
            'fields': ('average_hourly_delta', 'shannon_entropy', 'net_flux', 'persistence_at_full', 'persistence_at_empty')
        }),
        ('Categorization', {
            'fields': ('is_source', 'is_sink', 'is_ghost')
        }),
        ('Operations', {
            'fields': ('operational_hours', 'maintenance_incidents')
        }),
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'phone', 'created_at', 'user']
    search_fields = ['name', 'email', 'message']
    readonly_fields = ['created_at']


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'role', 'email', 'created_at']
    search_fields = ['name', 'role', 'email']
    readonly_fields = ['created_at']
