from django.db import models
from django.utils import timezone
from datetime import timedelta

class CommuneManager(models.Manager):
    """Custom manager for Commune model"""
    
    def with_station_count(self):
        """Annotate communes with station count"""
        return self.annotate(station_count=models.Count('stations'))
    
    def active_communes(self):
        """Get communes that have at least one active station"""
        return self.filter(stations__is_active=True).distinct()


class BikeStationManager(models.Manager):
    """Custom manager for BikeStation model"""
    
    def active_stations(self):
        """Get only active stations"""
        return self.filter(is_active=True)
    
    def by_commune(self, commune_code):
        """Get stations by commune code"""
        return self.filter(commune__code=commune_code)
    
    def with_latest_status(self):
        """Get stations with their latest status prefetched"""
        return self.select_related('commune').prefetch_related('statuses')


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

class DailyAnalyticsManager(models.Manager):
    """Custom manager for DailyAnalytics model"""
    
    def recent(self, days=30):
        """Get analytics from the last N days"""
        since = timezone.now().date() - timedelta(days=days)
        return self.filter(date__gte=since)
    
    def for_commune(self, commune):
        """Get analytics for a specific commune"""
        return self.filter(commune=commune)
    
    def for_station(self, station):
        """Get analytics for a specific station"""
        return self.filter(station=station)


class WeeklyAnalyticsManager(models.Manager):
    """Custom manager for WeeklyAnalytics model"""
    
    def recent(self, weeks=12):
        """Get analytics from the last N weeks"""
        since = timezone.now().date() - timedelta(weeks=weeks)
        return self.filter(week_start_date__gte=since)
    
    def for_commune(self, commune):
        """Get analytics for a specific commune"""
        return self.filter(commune=commune)
    
    def for_station(self, station):
        """Get analytics for a specific station"""
        return self.filter(station=station)
    
    def for_week(self, week_start_date):
        """Get all analytics for a specific week"""
        return self.filter(week_start_date=week_start_date)


class Commune(models.Model):
    """Model for Communes/Cities where Vélib stations are located"""
    code = models.CharField(max_length=10, unique=True)  # INSEE code
    name = models.CharField(max_length=100)
    population = models.IntegerField()
    area_km2 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    objects = CommuneManager()
    
    class Meta:
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class BikeStation(models.Model):
    """Model for bike sharing stations"""
    PROFILE_CHOICES = [
        ('commuter_source', 'Commuter Source'),  # Morning depleting, evening filling
        ('commuter_sink', 'Commuter Sink'),      # Morning filling, evening depleting
        ('balanced_hub', 'Balanced Hub'),        # Consistent flow throughout day
        ('ghost_station', 'Ghost Station'),      # Low entropy, low activity
        ('unknown', 'Unknown'),                  # Not yet classified
    ]
    
    station_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    commune = models.ForeignKey(Commune, on_delete=models.CASCADE, related_name='stations', null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    # Coordinate storage as JSON string for geographic queries: {"type": "Point", "coordinates": [lon, lat]}
    coordinates = models.JSONField(null=True, blank=True, help_text="Geographic coordinates as GeoJSON Point")
    total_docks = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Station profile classification
    profile = models.CharField(max_length=20, choices=PROFILE_CHOICES, default='unknown')
    
    objects = BikeStationManager()
    
    class Meta:
        ordering = ['station_id']
    
    def save(self, *args, **kwargs):
        """Automatically sync coordinates GeoJSON from latitude/longitude"""
        if self.latitude and self.longitude:
            self.coordinates = {
                "type": "Point",
                "coordinates": [float(self.longitude), float(self.latitude)]
            }
        super().save(*args, **kwargs)
    
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



class DailyAnalytics(models.Model):
    """Aggregated daily analytics with signal analysis metrics"""
    date = models.DateField()
    commune = models.ForeignKey(Commune, on_delete=models.CASCADE, related_name='daily_analytics', null=True, blank=True)
    station = models.ForeignKey(BikeStation, on_delete=models.CASCADE, related_name='daily_analytics', null=True, blank=True)
    
    # Basic metrics
    total_trips = models.IntegerField(default=0)
    total_duration_minutes = models.IntegerField(default=0)
    average_duration_minutes = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    average_utilization = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    peak_hour = models.IntegerField(null=True, blank=True)
    
    # Signal analysis metrics
    average_hourly_delta = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text="Average hourly change in bike count (V_h)")
    shannon_entropy = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Station predictability (0-8)")
    net_flux = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text="Sum of all deltas (Source > 0, Sink < 0)")
    persistence_at_full = models.IntegerField(default=0, help_text="Hours at 100% capacity")
    persistence_at_empty = models.IntegerField(default=0, help_text="Hours at 0% capacity")
    
    # Categorization
    is_source = models.BooleanField(default=False, help_text="Net positive flux (supplies bikes)")
    is_sink = models.BooleanField(default=False, help_text="Net negative flux (demands bikes)")
    is_ghost = models.BooleanField(default=False, help_text="Low entropy + low turnover")
    
    objects = DailyAnalyticsManager()
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['-date']),
            models.Index(fields=['commune', '-date']),
            models.Index(fields=['station', '-date']),
            models.Index(fields=['is_source']),
            models.Index(fields=['is_sink']),
            models.Index(fields=['is_ghost']),
        ]
        unique_together = [
            ['date', 'commune', 'station'],
        ]
    
    def __str__(self):
        if self.commune:
            return f"Analytics for {self.commune.code} on {self.date}"
        elif self.station:
            return f"Analytics for {self.station.station_id} on {self.date}"
        return f"Analytics for {self.date}"


class WeeklyAnalytics(models.Model):
    """Aggregated weekly analytics with signal analysis metrics"""
    week_start_date = models.DateField(help_text="Monday of the week")
    week_end_date = models.DateField(help_text="Sunday of the week")
    commune = models.ForeignKey(Commune, on_delete=models.CASCADE, related_name='weekly_analytics', null=True, blank=True)
    station = models.ForeignKey(BikeStation, on_delete=models.CASCADE, related_name='weekly_analytics', null=True, blank=True)
    
    # Basic aggregated metrics
    total_trips = models.IntegerField(default=0, help_text="Total trips for the week")
    total_duration_minutes = models.IntegerField(default=0, help_text="Sum of all trip durations")
    average_duration_minutes = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Average trip duration")
    average_utilization = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Average bike utilization rate")
    peak_day = models.IntegerField(null=True, blank=True, choices=[(i, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]) for i in range(7)], help_text="Busiest day of week (0=Monday, 6=Sunday)")
    peak_hour = models.IntegerField(null=True, blank=True, help_text="Most busy hour (0-23)")
    
    # Weekly signal analysis metrics
    average_hourly_delta = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text="Average hourly change in bike count")
    shannon_entropy = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Average entropy for the week (0-8)")
    net_flux = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text="Weekly sum of all deltas")
    persistence_at_full = models.IntegerField(default=0, help_text="Total hours at 100% capacity")
    persistence_at_empty = models.IntegerField(default=0, help_text="Total hours at 0% capacity")
    
    # Weekly categorization
    is_source = models.BooleanField(default=False, help_text="Net positive flux (supplies bikes)")
    is_sink = models.BooleanField(default=False, help_text="Net negative flux (demands bikes)")
    is_ghost = models.BooleanField(default=False, help_text="Low entropy + low turnover")
    
    # Operational metrics
    operational_hours = models.IntegerField(default=0, help_text="Total hours operational")
    maintenance_incidents = models.IntegerField(default=0, help_text="Number of maintenance events")
    
    objects = WeeklyAnalyticsManager()
    
    class Meta:
        ordering = ['-week_start_date']
        indexes = [
            models.Index(fields=['-week_start_date']),
            models.Index(fields=['commune', '-week_start_date']),
            models.Index(fields=['station', '-week_start_date']),
            models.Index(fields=['is_source']),
            models.Index(fields=['is_sink']),
            models.Index(fields=['is_ghost']),
        ]
        unique_together = [
            ['week_start_date', 'commune', 'station'],
        ]
    
    def __str__(self):
        if self.commune:
            return f"Weekly analytics for {self.commune.code} (Week {self.week_start_date} - {self.week_end_date})"
        elif self.station:
            return f"Weekly analytics for {self.station.station_id} (Week {self.week_start_date} - {self.week_end_date})"
        return f"Weekly analytics (Week {self.week_start_date} - {self.week_end_date})"
