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

from apps.analytics.models import BikeStation, StationStatus, DailyAnalytics, HourlyAnalytics, Commune


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
    def calculate_hourly_analytics(station: BikeStation, date: datetime.date) -> List[Dict]:
        """
        Aggregate StationStatus into hourly analytics records for a station on a given date.

        Returns list of dicts with HourlyAnalytics fields.
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

        # Group statuses by hour
        hourly_buckets: Dict[int, List[StationStatus]] = {}
        for status in statuses:
            hour = status.timestamp.hour
            hourly_buckets.setdefault(hour, []).append(status)

        hourly_records: List[Dict] = []
        previous_bikes_avg = None

        for hour in sorted(hourly_buckets.keys()):
            bucket = hourly_buckets[hour]
            data_points = len(bucket)
            bikes_avg = sum(s.available_bikes for s in bucket) / data_points
            docks_avg = sum(s.available_docks for s in bucket) / data_points
            total_avg = bikes_avg + docks_avg

            utilization_pct = (bikes_avg / total_avg * 100) if total_avg > 0 else 0
            if previous_bikes_avg is None:
                delta = 0
            else:
                delta = bikes_avg - previous_bikes_avg

            previous_bikes_avg = bikes_avg

            hour_ts = day_start + timedelta(hours=hour)

            hourly_records.append({
                'timestamp': hour_ts,
                'date': date,
                'hour': hour,
                'average_utilization': Decimal(str(round(utilization_pct, 2))),
                'bikes_available_avg': int(round(bikes_avg)),
                'docks_available_avg': int(round(docks_avg)),
                'hourly_delta': Decimal(str(round(delta, 2))),
                'data_points': data_points,
            })

        return hourly_records
    
    @staticmethod
    def calculate_coefficient_of_variation(availability_series: List[float]) -> float:
        """
        Calculate Coefficient of Variation (CV) of bike availability.
        
        CV = (std_dev / mean) * 100
        
        Measures predictability and activity:
        - High CV (>40%): Highly active/unpredictable
        - Medium CV (20-40%): Moderate activity
        - Low CV (<20%): Ghost station/stale
        - Mean=0: Ghost station (CV=0, marked as inactive)
        """
        if not availability_series or len(availability_series) < 2:
            return 0.0
        
        mean_val = sum(availability_series) / len(availability_series)
        
        # If mean is 0, mark as ghost station
        if mean_val == 0:
            return 0.0
        
        # Calculate standard deviation
        variance = sum((x - mean_val) ** 2 for x in availability_series) / len(availability_series)
        std_dev = variance ** 0.5
        
        # CV as percentage
        cv = (std_dev / mean_val) * 100
        
        return round(cv, 2)
    
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
    def profile_station(cv: float, net_flux: float, avg_delta_magnitude: float, 
                       delta_morning: float, delta_evening: float) -> str:
        """
        Classify station profile based on signal analysis.
        
        CV-based profiling:
        - Ghost: CV=0 (mean=0) or very low activity
        - Commuter: Strong morning/evening deltas
        - Balanced: Low CV + neutral flux
        
        Returns: profile type string
        """
        # Ghost Station: CV=0 (mean is 0) + Low turnover
        if cv == 0.0 and abs(avg_delta_magnitude) < 1.0:
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
        
        # Balanced Hub: Low CV + neutral flux
        if cv < 20.0 or abs(net_flux) < AdvancedAnalyticsService.NET_FLUX_THRESHOLD:
            return 'balanced_hub'
        
        return 'unknown'
    
    @staticmethod
    def calculate_daily_analytics(station: BikeStation, date: datetime.date) -> Dict:
        """
        Calculate all advanced analytics for a station on a given date.
        
        Returns dictionary with all metrics for DailyAnalytics creation.
        """
        hourly_records = HourlyAnalytics.objects.filter(
            station=station,
            date=date
        ).order_by('hour')

        if hourly_records.exists():
            hourly_list = list(hourly_records)
            bikes_series = [h.bikes_available_avg for h in hourly_list if h.data_points > 0]
            if not bikes_series:
                return None

            cv = AdvancedAnalyticsService.calculate_coefficient_of_variation(bikes_series)
            deltas = [float(h.hourly_delta) for h in hourly_list]
            net_flux = sum(deltas)
            avg_hourly_delta = sum(deltas) / len(deltas) if deltas else 0
            avg_delta_magnitude = sum(abs(d) for d in deltas) / len(deltas) if deltas else 0

            # Persistence based on hourly averages
            hours_full = sum(1 for h in hourly_list if h.docks_available_avg == 0 and h.data_points > 0)
            hours_empty = sum(1 for h in hourly_list if h.bikes_available_avg == 0 and h.data_points > 0)

            # Morning/Evening deltas for profiling
            morning_deltas = [float(h.hourly_delta) for h in hourly_list if 7 <= h.hour <= 10]
            evening_deltas = [float(h.hourly_delta) for h in hourly_list if 16 <= h.hour <= 19]
            delta_morning = sum(morning_deltas) / len(morning_deltas) if morning_deltas else 0
            delta_evening = sum(evening_deltas) / len(evening_deltas) if evening_deltas else 0

            profile = AdvancedAnalyticsService.profile_station(
                cv, net_flux, avg_delta_magnitude, delta_morning, delta_evening
            )

            is_source = net_flux > AdvancedAnalyticsService.NET_FLUX_THRESHOLD
            is_sink = net_flux < -AdvancedAnalyticsService.NET_FLUX_THRESHOLD
            is_ghost = profile == 'ghost_station'

            avg_utilization = sum(float(h.average_utilization) for h in hourly_list) / len(hourly_list)
            peak_hour = max(hourly_list, key=lambda h: h.average_utilization).hour if hourly_list else None

            return {
                'average_hourly_delta': Decimal(str(round(avg_hourly_delta, 2))),
                'shannon_entropy': Decimal(str(cv)),
                'net_flux': Decimal(str(round(net_flux, 2))),
                'persistence_at_full': hours_full,
                'persistence_at_empty': hours_empty,
                'is_source': is_source,
                'is_sink': is_sink,
                'is_ghost': is_ghost,
                'average_utilization': Decimal(str(round(avg_utilization, 2))),
                'peak_hour': peak_hour,
            }

        # Fallback to StationStatus if hourly not computed yet
        day_start = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        day_end = timezone.make_aware(datetime.combine(date + timedelta(days=1), datetime.min.time()))
        statuses = StationStatus.objects.filter(
            station=station,
            timestamp__gte=day_start,
            timestamp__lt=day_end
        ).order_by('timestamp')

        if not statuses.exists():
            return None

        deltas = AdvancedAnalyticsService.calculate_hourly_delta(station, date)
        if not deltas:
            return None

        availability_series = [s.available_bikes for s in statuses]
        cv = AdvancedAnalyticsService.calculate_coefficient_of_variation(availability_series)
        net_flux = AdvancedAnalyticsService.calculate_net_flux(deltas)
        avg_hourly_delta = sum(d['delta'] for d in deltas) / len(deltas)
        avg_delta_magnitude = sum(abs(d['delta']) for d in deltas) / len(deltas)

        hours_full, hours_empty = AdvancedAnalyticsService.calculate_persistence(statuses)

        morning_deltas = [d['delta'] for d in deltas if 7 <= d['hour'] <= 10]
        evening_deltas = [d['delta'] for d in deltas if 16 <= d['hour'] <= 19]
        delta_morning = sum(morning_deltas) / len(morning_deltas) if morning_deltas else 0
        delta_evening = sum(evening_deltas) / len(evening_deltas) if evening_deltas else 0

        profile = AdvancedAnalyticsService.profile_station(
            cv, net_flux, avg_delta_magnitude, delta_morning, delta_evening
        )

        is_source = net_flux > AdvancedAnalyticsService.NET_FLUX_THRESHOLD
        is_sink = net_flux < -AdvancedAnalyticsService.NET_FLUX_THRESHOLD
        is_ghost = profile == 'ghost_station'

        avg_utilization = statuses.aggregate(
            avg=Avg('available_bikes', output_field=DecimalField())
        )['avg'] or 0
        avg_utilization_pct = (avg_utilization / station.capacity * 100) if station.capacity > 0 else 0

        return {
            'average_hourly_delta': Decimal(str(round(avg_hourly_delta, 2))),
            'shannon_entropy': Decimal(str(cv)),
            'net_flux': Decimal(str(round(net_flux, 2))),
            'persistence_at_full': hours_full,
            'persistence_at_empty': hours_empty,
            'is_source': is_source,
            'is_sink': is_sink,
            'is_ghost': is_ghost,
            'average_utilization': Decimal(str(round(avg_utilization_pct, 2))),
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
        ).values('station__stationcode', 'station__name').annotate(
            avg_net_flux=Avg('net_flux'),
            avg_cv=Avg('shannon_entropy'),
            days_as_source=Count('id')
        ).order_by('-avg_net_flux')[:limit]
        
        sinks = DailyAnalytics.objects.filter(
            station__isnull=False,
            is_sink=True,
            date__gte=since
        ).values('station__stationcode', 'station__name').annotate(
            avg_net_flux=Avg('net_flux'),
            avg_cv=Avg('shannon_entropy'),
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
        ).values('station__stationcode', 'station__name').annotate(
            avg_cv=Avg('shannon_entropy'),
            avg_daily_turnover=Avg('average_hourly_delta'),
            ghost_occurrences=Count('id')
        ).filter(
            ghost_occurrences__gte=5  # Ghost on at least 5 days in the period
        ).order_by('-ghost_occurrences')[:limit]
        
        return list(ghost_stations)    
    @staticmethod
    def calculate_weekly_analytics(station: BikeStation, week_start_date: datetime.date) -> Dict:
        """
        Calculate weekly aggregated analytics from daily records.
        
        Args:
            station: BikeStation instance
            week_start_date: Monday of the target week
            
        Returns:
            Dictionary with weekly metrics for WeeklyAnalytics creation.
        """
        from django.db.models import Avg, Sum, Max, Min
        
        # Define week boundaries
        week_end_date = week_start_date + timedelta(days=6)  # Sunday
        
        # Fetch all daily analytics for this station in this week
        daily_records = DailyAnalytics.objects.filter(
            station=station,
            date__gte=week_start_date,
            date__lte=week_end_date
        )
        
        if not daily_records.exists():
            return None
        
        # Aggregate daily metrics
        weekly_stats = daily_records.aggregate(
            avg_utilization=Avg('average_utilization'),
            avg_hourly_delta=Avg('average_hourly_delta'),
            total_net_flux=Sum('net_flux'),
            avg_entropy=Avg('shannon_entropy'),
            total_hours_full=Sum('persistence_at_full'),
            total_hours_empty=Sum('persistence_at_empty'),
            total_days=Count('id'),
            peak_hour=Avg('peak_hour'),
            days_source=Count('id', filter=Q(is_source=True)),
            days_sink=Count('id', filter=Q(is_sink=True)),
            days_ghost=Count('id', filter=Q(is_ghost=True)),
        )
        
        # Find peak day (day of week with highest traffic)
        peak_day = None
        if daily_records.exists():
            peak_daily = daily_records.annotate(
                day_of_week=F('date__week_day')
            ).order_by('-average_hourly_delta').first()
            peak_day = peak_daily.date.weekday() if peak_daily else None
        
        # Determine weekly categorization
        total_net_flux = float(weekly_stats['total_net_flux'] or 0)
        is_source = total_net_flux > AdvancedAnalyticsService.NET_FLUX_THRESHOLD * 7  # Scaled for week
        is_sink = total_net_flux < -AdvancedAnalyticsService.NET_FLUX_THRESHOLD * 7
        is_ghost = weekly_stats['days_ghost'] >= 4  # Ghost for at least 4 days of the week
        
        return {
            'average_utilization': Decimal(str(round(float(weekly_stats['avg_utilization'] or 0), 2))),
            'peak_day': peak_day,
            'peak_hour': int(weekly_stats['peak_hour'] or 0) if weekly_stats['peak_hour'] else None,
            'average_hourly_delta': Decimal(str(round(float(weekly_stats['avg_hourly_delta'] or 0), 2))),
            'shannon_entropy': Decimal(str(round(float(weekly_stats['avg_entropy'] or 0), 2))),
            'net_flux': Decimal(str(round(float(weekly_stats['total_net_flux'] or 0), 2))),
            'persistence_at_full': weekly_stats['total_hours_full'] or 0,
            'persistence_at_empty': weekly_stats['total_hours_empty'] or 0,
            'is_source': is_source,
            'is_sink': is_sink,
            'is_ghost': is_ghost,
            'operational_hours': min(weekly_stats['total_days'] * 24, 168),  # Max 168 hours in a week
            'maintenance_incidents': 0,  # Would need to track maintenance events separately
        }