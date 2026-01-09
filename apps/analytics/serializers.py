from rest_framework import serializers
from .models import Arrondissement, BikeStation, StationStatus, Trip, DailyAnalytics


class ArrondissementSerializer(serializers.ModelSerializer):
    stations_count = serializers.IntegerField(source='stations.count', read_only=True)
    
    class Meta:
        model = Arrondissement
        fields = ['id', 'code', 'name', 'population', 'area_km2', 'stations_count']


class BikeStationSerializer(serializers.ModelSerializer):
    arrondissement_code = serializers.CharField(source='arrondissement.code', read_only=True)
    current_status = serializers.SerializerMethodField()
    
    class Meta:
        model = BikeStation
        fields = ['id', 'station_id', 'name', 'arrondissement', 'arrondissement_code', 
                  'latitude', 'longitude', 'total_docks', 'is_active', 'current_status']
    
    def get_current_status(self, obj):
        latest_status = obj.statuses.first()
        if latest_status:
            return StationStatusSerializer(latest_status).data
        return None


class StationStatusSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    utilization_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = StationStatus
        fields = ['id', 'station', 'station_name', 'timestamp', 'available_bikes', 
                  'available_docks', 'is_operational', 'utilization_rate']


class TripSerializer(serializers.ModelSerializer):
    start_station_name = serializers.CharField(source='start_station.name', read_only=True)
    end_station_name = serializers.CharField(source='end_station.name', read_only=True)
    
    class Meta:
        model = Trip
        fields = ['id', 'trip_id', 'start_station', 'start_station_name', 
                  'end_station', 'end_station_name', 'start_time', 'end_time', 
                  'duration_minutes', 'distance_km', 'user_type']


class DailyAnalyticsSerializer(serializers.ModelSerializer):
    arrondissement_code = serializers.CharField(source='arrondissement.code', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)
    
    class Meta:
        model = DailyAnalytics
        fields = ['id', 'date', 'arrondissement', 'arrondissement_code', 'station', 
                  'station_name', 'total_trips', 'total_duration_minutes', 
                  'average_duration_minutes', 'average_utilization', 'peak_hour']


class ArrondissementAnalyticsSerializer(serializers.Serializer):
    """Serializer for arrondissement analytics summary"""
    arr = serializers.CharField()
    stations = serializers.IntegerField()
    bikes = serializers.IntegerField()
    docks = serializers.IntegerField()
    trips = serializers.IntegerField()
    utilization = serializers.FloatField()
    population = serializers.IntegerField()


class LiveDashboardSerializer(serializers.Serializer):
    """Serializer for live dashboard data"""
    total_stations = serializers.IntegerField()
    active_stations = serializers.IntegerField()
    total_bikes = serializers.IntegerField()
    total_docks = serializers.IntegerField()
    current_trips = serializers.IntegerField()
    avg_utilization = serializers.FloatField()
