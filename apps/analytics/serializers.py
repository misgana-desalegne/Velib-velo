from rest_framework import serializers
from .models import Commune, BikeStation, StationStatus, DailyAnalytics, HourlyAnalytics, WeeklyAnalytics, ContactMessage, TeamMember
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'user', 'name', 'email', 'phone', 'message', 'created_at']


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ['id', 'name', 'role', 'image_url', 'github_url', 'linkedin_url', 'email', 'website_url', 'cv_url', 'created_at']


class CommuneSerializer(serializers.ModelSerializer):
    stations_count = serializers.IntegerField(source='stations.count', read_only=True)
    
    class Meta:
        model = Commune
        fields = ['id', 'code', 'name', 'population', 'area_km2', 'stations_count']


class BikeStationSerializer(serializers.ModelSerializer):
    stationcode = serializers.CharField(read_only=True)
    commune_code = serializers.CharField(source='commune.code', read_only=True)
    commune_name = serializers.CharField(source='commune.name', read_only=True)
    
    class Meta:
        model = BikeStation
        fields = ['id', 'stationcode', 'name', 'commune_code', 'commune_name',
                  'latitude', 'longitude', 'capacity', 'numbikesavailable', 
                  'numdocksavailable', 'mechanical', 'ebike', 'is_installed', 
                  'is_renting', 'is_returning', 'coordinates', 'profile']


class StationStatusSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    utilization_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = StationStatus
        fields = ['id', 'station', 'station_name', 'timestamp', 'available_bikes', 
                  'available_docks', 'is_operational', 'utilization_rate']


class DailyAnalyticsSerializer(serializers.ModelSerializer):
    commune_code = serializers.CharField(source='commune.code', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)
    
    class Meta:
        model = DailyAnalytics
        fields = ['id', 'date', 'commune', 'commune_code', 'station', 
                  'station_name', 'average_utilization', 'peak_hour',
                  'shannon_entropy', 'net_flux', 'is_source', 'is_sink', 'is_ghost']


class HourlyAnalyticsSerializer(serializers.ModelSerializer):
    commune_code = serializers.CharField(source='commune.code', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)

    class Meta:
        model = HourlyAnalytics
        fields = ['id', 'timestamp', 'date', 'hour', 'commune', 'commune_code', 'station',
                  'station_name', 'average_utilization', 'bikes_available_avg',
                  'docks_available_avg', 'hourly_delta', 'data_points']


class WeeklyAnalyticsSerializer(serializers.ModelSerializer):
    commune_code = serializers.CharField(source='commune.code', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)

    class Meta:
        model = WeeklyAnalytics
        fields = ['id', 'week_start_date', 'week_end_date', 'commune', 'commune_code',
                  'station', 'station_name', 'average_utilization', 'peak_day',
                  'peak_hour', 'average_hourly_delta', 'shannon_entropy', 'net_flux',
                  'persistence_at_full', 'persistence_at_empty', 'is_source',
                  'is_sink', 'is_ghost', 'operational_hours', 'maintenance_incidents']


class CommuneAnalyticsSerializer(serializers.Serializer):
    """Serializer for commune analytics summary"""
    code = serializers.CharField()
    name = serializers.CharField()
    stations = serializers.IntegerField()
    bikes = serializers.IntegerField()
    docks = serializers.IntegerField()
    capacity = serializers.IntegerField()
    utilization = serializers.FloatField()
    cv = serializers.FloatField()
    population = serializers.IntegerField()
    # Optional hourly timeseries for last N hours (each item follows HourlyAnalyticsSerializer)
    hourly = HourlyAnalyticsSerializer(many=True, required=False)


class LiveDashboardSerializer(serializers.Serializer):
    """Serializer for live dashboard data"""
    total_stations = serializers.IntegerField()
    active_stations = serializers.IntegerField()
    total_bikes = serializers.IntegerField()
    total_docks = serializers.IntegerField()
    avg_utilization = serializers.FloatField()
