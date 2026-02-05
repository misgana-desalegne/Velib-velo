"""
Data formatting utility functions.
"""


def format_analytics_data(data):
    """
    Format analytics data for consistent output.
    
    Args:
        data: Raw analytics data
        
    Returns:
        dict: Formatted analytics data
    """
    return {
        'arr': data.get('arr', ''),
        'stations': int(data.get('stations', 0)),
        'bikes': int(data.get('bikes', 0)),
        'docks': int(data.get('docks', 0)),
        'trips': int(data.get('trips', 0)),
        'utilization': round(float(data.get('utilization', 0)), 2),
        'population': int(data.get('population', 0)),
    }


def format_station_data(station, status=None):
    """
    Format station data with optional status.
    
    Args:
        station: BikeStation instance
        status: StationStatus instance (optional)
        
    Returns:
        dict: Formatted station data
    """
    data = {
        'id': station.id,
        'station_id': station.station_id,
        'name': station.name,
        'arrondissement': station.arrondissement.code,
        'latitude': float(station.latitude),
        'longitude': float(station.longitude),
        'total_docks': station.total_docks,
        'is_installed': station.is_installed,
    }
    
    if status:
        data['current_status'] = {
            'available_bikes': status.available_bikes,
            'available_docks': status.available_docks,
            'utilization_rate': status.utilization_rate,
            'is_operational': status.is_operational,
            'timestamp': status.timestamp.isoformat(),
        }
    
    return data


def format_dashboard_stats(stats):
    """
    Format dashboard statistics for consistent output.
    
    Args:
        stats: Raw dashboard stats
        
    Returns:
        dict: Formatted dashboard stats
    """
    return {
        'total_stations': int(stats.get('total_stations', 0)),
        'active_stations': int(stats.get('active_stations', 0)),
        'total_bikes': int(stats.get('total_bikes', 0)),
        'total_docks': int(stats.get('total_docks', 0)),
        'current_trips': int(stats.get('current_trips', 0)),
        'avg_utilization': round(float(stats.get('avg_utilization', 0)), 2),
    }
