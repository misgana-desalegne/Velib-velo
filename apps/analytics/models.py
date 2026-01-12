from django.db import models
from django.utils import timezone
from datetime import timedelta


class ArrondissementManager(models.Manager):
    """Custom manager for Arrondissement model"""
    
    def with_station_count(self):
        """Annotate arrondissements with station count"""
        return self.annotate(station_count=models.Count('stations'))
    
    def active_arrondissements(self):
        """Get arrondissements that have at least one active station"""
        return self.filter(stations__is_active=True).distinct()


class BikeStationManager(models.Manager):
    """Custom manager for BikeStation model"""
    
    def active_stations(self):
        """Get only active stations"""
        return self.filter(is_active=True)
    
    def by_arrondissement(self, arrondissement_code):
        """Get stations by arrondissement code"""
        return self.filter(arrondissement__code=arrondissement_code)
    
    def with_latest_status(self):
        """Get stations with their latest status prefetched"""
        return self.select_related('arrondissement').prefetch_related('statuses')


class StationStatusManager(models.Manager):
    """Custom manager for StationStatus model"""
    
    def recent(self, hours=24):
        """Get status records from the last N hours"""
        since = timezone.now() - timedelta(hours=hours)
        return self.filter(timestamp__gte=since)
    
    def for_station(self, station):
        """Get all status records for a specific station"""
        return self.filter(station=station).order_by('-timestamp')
    
    def latest_for_stations(self):
        """Get the latest status for each station"""
        return self.order_by('station', '-timestamp').distinct('station')


class TripManager(models.Manager):
    """Custom manager for Trip model"""
    
    def in_date_range(self, start_date=None, end_date=None):
        """Get trips within a date range"""
        queryset = self.all()
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date)
        return queryset
    
    def recent(self, days=30):
        """Get trips from the last N days"""
        since = timezone.now() - timedelta(days=days)
        return self.filter(start_time__gte=since)
    
    def by_arrondissement(self, arrondissement):
        """Get trips starting in a specific arrondissement"""
        return self.filter(start_station__arrondissement=arrondissement)


class DailyAnalyticsManager(models.Manager):
    """Custom manager for DailyAnalytics model"""
    
    def recent(self, days=30):
        """Get analytics from the last N days"""
        since = timezone.now().date() - timedelta(days=days)
        return self.filter(date__gte=since)
    
    def for_arrondissement(self, arrondissement):
        """Get analytics for a specific arrondissement"""
        return self.filter(arrondissement=arrondissement)
    
    def for_station(self, station):
        """Get analytics for a specific station"""
        return self.filter(station=station)


class Arrondissement(models.Model):
    """Model for Paris Arrondissements"""
    code = models.CharField(max_length=10, unique=True)  # e.g., '1er', '2e'
    name = models.CharField(max_length=100)
    population = models.IntegerField()
    area_km2 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    objects = ArrondissementManager()
    
    class Meta:
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class BikeStation(models.Model):
    """Model for bike sharing stations"""
    station_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    arrondissement = models.ForeignKey(Arrondissement, on_delete=models.CASCADE, related_name='stations')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    total_docks = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = BikeStationManager()
    
    class Meta:
        ordering = ['station_id']
    
    def __str__(self):
        return f"{self.station_id} - {self.name}"


class StationStatus(models.Model):
    """Real-time status of bike stations"""
    station = models.ForeignKey(BikeStation, on_delete=models.CASCADE, related_name='statuses')
    timestamp = models.DateTimeField(default=timezone.now)
    available_bikes = models.IntegerField()
    available_docks = models.IntegerField()
    objects = StationStatusManager()
    
    is_operational = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['station', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.station.station_id} - {self.timestamp}"
    
    @property
    def utilization_rate(self):
        total = self.available_bikes + self.available_docks
        if total > 0:
            return round((self.available_bikes / total) * 100, 2)
        return 0


class Trip(models.Model):
    """Model for bike trips"""
    trip_id = models.CharField(max_length=100, unique=True)
    start_station = models.ForeignKey(BikeStation, on_delete=models.CASCADE, related_name='trips_started')
    end_station = models.ForeignKey(BikeStation, on_delete=models.CASCADE, related_name='trips_ended')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_minutes = models.IntegerField()
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    user_type = models.CharField(max_length=50, choices=[
        ('subscriber', 'Subscriber'),
        ('customer', 'Customer'),
    ])
    
    objects = TripManager()
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['-start_time']),
            models.Index(fields=['start_station', '-start_time']),
            models.Index(fields=['end_station', '-start_time']),
        ]
    
    def __str__(self):
        return f"Trip {self.trip_id}"


class DailyAnalytics(models.Model):
    """Aggregated daily analytics"""
    date = models.DateField()
    arrondissement = models.ForeignKey(Arrondissement, on_delete=models.CASCADE, related_name='daily_analytics', null=True, blank=True)
    station = models.ForeignKey(BikeStation, on_delete=models.CASCADE, related_name='daily_analytics', null=True, blank=True)
    
    total_trips = models.IntegerField(default=0)
    total_duration_minutes = models.IntegerField(default=0)
    average_duration_minutes = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    average_utilization = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    objects = DailyAnalyticsManager()
    
    peak_hour = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['-date']),
            models.Index(fields=['arrondissement', '-date']),
            models.Index(fields=['station', '-date']),
        ]
        unique_together = [
            ['date', 'arrondissement', 'station'],
        ]
    
    def __str__(self):
        if self.arrondissement:
            return f"Analytics for {self.arrondissement.code} on {self.date}"
        elif self.station:
            return f"Analytics for {self.station.station_id} on {self.date}"
        return f"Analytics for {self.date}"
