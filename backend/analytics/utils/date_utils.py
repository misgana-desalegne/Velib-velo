"""
Date and time utility functions.
"""
from django.utils import timezone
from datetime import timedelta


def calculate_date_range(days=30):
    """
    Calculate a date range from current date going back specified days.
    
    Args:
        days: Number of days to go back (default: 30)
        
    Returns:
        tuple: (start_date, end_date)
    """
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


def get_time_ago(hours=24):
    """
    Get a datetime object for specified hours ago.
    
    Args:
        hours: Number of hours to go back (default: 24)
        
    Returns:
        datetime: Datetime object for the specified time ago
    """
    return timezone.now() - timedelta(hours=hours)


def get_date_range_from_params(params):
    """
    Extract and validate date range from query parameters.
    
    Args:
        params: Query parameters dict
        
    Returns:
        tuple: (start_date, end_date) or (None, None)
    """
    start_date = params.get('start_date', None)
    end_date = params.get('end_date', None)
    return start_date, end_date
