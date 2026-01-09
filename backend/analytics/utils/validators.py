"""
Validation utility functions.
"""
from ..models import BikeStation, Arrondissement


def validate_station_id(station_id):
    """
    Validate if a station ID exists.
    
    Args:
        station_id: Station ID to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    return BikeStation.objects.filter(station_id=station_id).exists()


def validate_arrondissement_code(code):
    """
    Validate if an arrondissement code exists.
    
    Args:
        code: Arrondissement code to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    return Arrondissement.objects.filter(code=code).exists()


def validate_date_format(date_string):
    """
    Validate date string format.
    
    Args:
        date_string: Date string to validate
        
    Returns:
        bool: True if valid ISO format, False otherwise
    """
    from datetime import datetime
    try:
        datetime.fromisoformat(date_string)
        return True
    except (ValueError, TypeError):
        return False
