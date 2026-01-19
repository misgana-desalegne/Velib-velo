"""
Advanced Analytics Service for signal analysis and station profiling.

Implements calculation of:
- Hourly Delta (V_h): Rate of change in bike inventory
- Shannon Entropy: Station predictability
- Net Flux: Categorization as Source or Sink
- Persistence: Time at capacity extremes
- Station Profiles: Commuter Source/Sink, Balanced Hub, Ghost Station
"""

import math
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Tuple
from django.db.models import F, Q, Avg, Sum, Count, Case, When, DecimalField, IntegerField
from django.utils import timezone

from apps.analytics.models import BikeStation, StationStatus, DailyAnalytics, Commune


class AdvancedAnalyticsService:
    """Service for advanced signal analysis and station profiling"""
    
    # Station profile thresholds
    ENTROPY_THRESHOLD_LOW = 1.5  # Low entropy = low functional
    ENTROPY_THRESHOLD_HIGH = 4.0  # High entropy = high onal
    NET_FLUX_THRESHOLD = 5.0  # Bikes per day minimum to be considered source/sink
    GHOST_ENTROPY_MAX = 1.0
    GHOST_TURNOVER_MIN = 2  # Minimum average hourly delta magnitude
    
    @staticmethod
    def calculate_hourly_delta(station: BikeStation, date: datetime.date) -> List[Dict]:
        """
        Calculate hourly delta (V_h) for a station on a given date.
        
        V_h = B(h) - B(h-1)  for each hour
        
        Returns list of {hour, delta, utilization_start, utilization_end}
        """
        day_start = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        day_end = timezone.make_aware(datetime.combine(date + timedelta(days=1), datetime.min.time()))
        
        statuses = StationStatus.objects.filter(
            station=station,
            timestamp__gte=day_start,
            timestamp__lt=day_end
        ).order_by('timestamp')
        
        if not statuses.exists():
            return []
        
        hourly_data = {}
        for status in statuses:
            hour = status.timestamp.hour
            if hour not in hourly_data:
                hourly_data[hour] = status
            else:
                # Keep the first reading of each hour (or latest if you prefer)
                hourly_data[hour] = status
        
        deltas = []
        hours = sorted(hourly_data.keys())
        
        for i in range(1, len(hours)):
            prev_hour = hours[i - 1]
            curr_hour = hours[i]
            prev_status = hourly_data[prev_hour]
            curr_status = hourly_data[curr_hour]
            
            delta = curr_status.available_bikes - prev_status.available_bikes
            
            deltas.append({
                'hour': curr_hour,
                'delta': delta,
                'utilization_start': prev_status.utilization_rate,
                'utilization_end': curr_status.utilization_rate,
                'bikes_before': prev_status.available_bikes,
                'bikes_after': curr_status.available_bikes,
            })
        
        return deltas
    
    @staticmethod
    def calculate_shannon_entropy(deltas: List[Dict]) -> float:
        """
        Calculate Shannon Entropy of hourly deltas.
        
        H = -Σ(p_i * log2(p_i))
        
        Measures predictability:
        - High entropy (4-8): Dynamic, unpredictable
        - Low entropy (0-2): Stale, predictable
        """
        if not deltas or len(deltas) < 2:
            return 0.0
        
        # Normalize deltas into bins
        delta_values = [d['delta'] for d in deltas]
        
        if all(v == 0 for v in delta_values):
            return 0.0
        
        min_delta = min(delta_values)
        max_delta = max(delta_values)
        
        if min_delta == max_delta:
            return 0.0
        
        # Create 5 bins
        bins = [0] * 5
        for delta in delta_values:
            bin_idx = min(4, int((delta - min_delta) / (max_delta - min_delta + 1) * 5))
            bins[bin_idx] += 1
        
        # Calculate entropy
        total = len(delta_values)
        entropy = 0.0
        
        for count in bins:
            if count > 0:
                p = count / total
                entropy -= p * math.log2(p)
        
        return round(entropy, 2)
    
    @staticmethod
    def calculate_net_flux(deltas: List[Dict]) -> float:
        """
        Calculate net flux (sum of all hourly deltas).
        
        Positive: Station is a SOURCE (supplies bikes)
        Negative: Station is a SINK (demands bikes)
        """
        if not deltas:
            return 0.0
        
        return float(sum(d['delta'] for d in deltas))
    
    @staticmethod
    def calculate_persistence(statuses_queryset) -> Tuple[int, int]:
        """
        Calculate time spent at capacity extremes.
        
        Returns: (hours_at_100%, hours_at_0%)
        """
        hours_full = 0
        hours_empty = 0
        
        for status in statuses_queryset:
            if status.utilization_rate >= 99.0:
                hours_full += 1
            elif status.utilization_rate <= 1.0:
                hours_empty += 1
        
        return hours_full, hours_empty
    
    @staticmethod
    def profile_station(entropy: float, net_flux: float, avg_delta_magnitude: float, 
                       delta_morning: float, delta_evening: float) -> str:
        """
        Classify station profile based on signal analysis.
        
        Returns: profile type string
        """
        # Ghost Station: Low entropy + Low turnover
        if entropy <= AdvancedAnalyticsService.GHOST_ENTROPY_MAX and abs(avg_delta_magnitude) < 1.0:
            return 'ghost_station'
        
        # Check if it's a source or sink with clear morning/evening patterns
        has_morning_pattern = delta_morning != 0
        has_evening_pattern = delta_evening != 0
        
        # Commuter Source: Depletes in morning (delta < 0), fills in evening (delta > 0)
        if has_morning_pattern and delta_morning < -2 and has_evening_pattern and delta_evening > 2:
            return 'commuter_source'
        
        # Commuter Sink: Fills in morning (delta > 0), depletes in evening (delta < 0)
        if has_morning_pattern and delta_morning > 2 and has_evening_pattern and delta_evening < -2:
            return 'commuter_sink'
        
        # Balanced Hub: Low variance throughout day
        if entropy > 2.0 or abs(net_flux) < AdvancedAnalyticsService.NET_FLUX_THRESHOLD:
            return 'balanced_hub'
        
        return 'unknown'
    
    @staticmethod
    def calculate_daily_analytics(station: BikeStation, date: datetime.date) -> Dict:
        """
        Calculate all advanced analytics for a station on a given date.
        
        Returns dictionary with all metrics for DailyAnalytics creation.
        """
        day_start = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        day_end = timezone.make_aware(datetime.combine(date + timedelta(days=1), datetime.min.time()))
        
        statuses = StationStatus.objects.filter(
            station=station,
            timestamp__gte=day_start,
            timestamp__lt=day_end
        ).order_by('timestamp')
        
        if not statuses.exists():
            return None
        
        # Calculate hourly deltas
        deltas = AdvancedAnalyticsService.calculate_hourly_delta(station, date)
        
        if not deltas:
            return None
        
        # Core metrics
        entropy = AdvancedAnalyticsService.calculate_shannon_entropy(deltas)
        net_flux = AdvancedAnalyticsService.calculate_net_flux(deltas)
        avg_hourly_delta = sum(d['delta'] for d in deltas) / len(deltas)
        avg_delta_magnitude = sum(abs(d['delta']) for d in deltas) / len(deltas)
        
        # Persistence
        hours_full, hours_empty = AdvancedAnalyticsService.calculate_persistence(statuses)
        
        # Morning/Evening deltas for profiling
        morning_deltas = [d['delta'] for d in deltas if 7 <= d['hour'] <= 10]
        evening_deltas = [d['delta'] for d in deltas if 16 <= d['hour'] <= 19]
        
        delta_morning = sum(morning_deltas) / len(morning_deltas) if morning_deltas else 0
        delta_evening = sum(evening_deltas) / len(evening_deltas) if evening_deltas else 0
        
        # Profile classification
        profile = AdvancedAnalyticsService.profile_station(
            entropy, net_flux, avg_delta_magnitude, delta_morning, delta_evening
        )
        
        # Categorization
        is_source = net_flux > AdvancedAnalyticsService.NET_FLUX_THRESHOLD
        is_sink = net_flux < -AdvancedAnalyticsService.NET_FLUX_THRESHOLD
        is_ghost = profile == 'ghost_station'
        
        # Average utilization
        avg_utilization = statuses.aggregate(
            avg=Avg('available_bikes', output_field=DecimalField())
        )['avg'] or 0
        avg_utilization_pct = (avg_utilization / station.total_docks * 100) if station.total_docks > 0 else 0
        
        return {
            'average_hourly_delta': Decimal(str(round(avg_hourly_delta, 2))),
            'shannon_entropy': Decimal(str(entropy)),
            'net_flux': Decimal(str(round(net_flux, 2))),
            'persistence_at_full': hours_full,
            'persistence_at_empty': hours_empty,
            'is_source': is_source,
            'is_sink': is_sink,
            'is_ghost': is_ghost,
            'average_utilization': Decimal(str(round(avg_utilization_pct, 2))),
            'total_trips': len(deltas),  # Number of hourly transitions
        }
    
    @staticmethod
    def get_top_sources_and_sinks(days: int = 15, limit: int = 10) -> Dict:
        """
        Query top SOURCE and SINK stations over a period.
        
        Returns:
        {
            'sources': [station data],
            'sinks': [station data]
        }
        """
        since = timezone.now().date() - timedelta(days=days)
        
        sources = DailyAnalytics.objects.filter(
            station__isnull=False,
            is_source=True,
            date__gte=since
        ).values('station__station_id', 'station__name').annotate(
            avg_net_flux=Avg('net_flux'),
            avg_entropy=Avg('shannon_entropy'),
            days_as_source=Count('id')
        ).order_by('-avg_net_flux')[:limit]
        
        sinks = DailyAnalytics.objects.filter(
            station__isnull=False,
            is_sink=True,
            date__gte=since
        ).values('station__station_id', 'station__name').annotate(
            avg_net_flux=Avg('net_flux'),
            avg_entropy=Avg('shannon_entropy'),
            days_as_sink=Count('id')
        ).order_by('avg_net_flux')[:limit]
        
        return {
            'sources': list(sources),
            'sinks': list(sinks),
            'period_days': days,
        }
    
    @staticmethod
    def get_ghost_stations(days: int = 15, limit: int = 20) -> List:
        """
        Get Ghost Stations (low entropy, low turnover) - candidates for relocation.
        """
        since = timezone.now().date() - timedelta(days=days)
        
        ghost_stations = DailyAnalytics.objects.filter(
            station__isnull=False,
            is_ghost=True,
            date__gte=since
        ).values('station__station_id', 'station__name').annotate(
            avg_entropy=Avg('shannon_entropy'),
            avg_daily_turnover=Avg('average_hourly_delta'),
            ghost_occurrences=Count('id')
        ).filter(
            ghost_occurrences__gte=5  # Ghost on at least 5 days in the period
        ).order_by('-ghost_occurrences')[:limit]
        
        return list(ghost_stations)
