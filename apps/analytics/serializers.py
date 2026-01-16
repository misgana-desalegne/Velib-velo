from rest_framework import serializers
from .models import Commune, BikeStation, StationStatus, DailyAnalytics


class CommuneSerializer(serializers.ModelSerializer):
    stations_count = serializers.IntegerField(source='stations.count', read_only=True)
    
    class Meta:
        model = Commune
        fields = ['id', 'code', 'name', 'population', 'area_km2', 'stations_count']


class BikeStationSerializer(serializers.ModelSerializer):
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
                  'station_name', 'total_trips', 'average_utilization', 'peak_hour',
                  'shannon_entropy', 'net_flux', 'is_source', 'is_sink', 'is_ghost']


class CommuneAnalyticsSerializer(serializers.Serializer):
    """Serializer for commune analytics summary"""
    code = serializers.CharField()
    name = serializers.CharField()
    stations = serializers.IntegerField()
    bikes = serializers.IntegerField()
    docks = serializers.IntegerField()
    capacity = serializers.IntegerField()
    utilization = serializers.FloatField()
    population = serializers.IntegerField()


class LiveDashboardSerializer(serializers.Serializer):
    """Serializer for live dashboard data"""
    total_stations = serializers.IntegerField()
    active_stations = serializers.IntegerField()
    total_bikes = serializers.IntegerField()
    total_docks = serializers.IntegerField()
    avg_utilization = serializers.FloatField()
