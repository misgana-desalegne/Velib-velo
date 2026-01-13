"""
Data Extraction Module

Handles extraction of bike station data from Vélib API.
"""
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests
import logging

logger = logging.getLogger(__name__)


class VelibAPIExtractor:
    """Extract data from Vélib API"""
    
    def __init__(self, api_base_url: str = "https://opendata.paris.fr/api/records/1.0/search"):
        self.api_base_url = api_base_url
        self.dataset_id = "velib-disponibilite-en-temps-reel"
    
    def extract_station_data(self, limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Extract real-time station data from Vélib API
        
        Args:
            limit: Maximum number of records to fetch
            
        Returns:
            List of station status records
        """
        try:
            params = {
                'dataset': self.dataset_id,
                'rows': limit,
                'timezone': 'Europe/Paris'
            }
            
            response = requests.get(self.api_base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            records = data.get('records', [])
            
            logger.info(f"Extracted {len(records)} records from Vélib API")
            return records
            
        except requests.RequestException as e:
            logger.error(f"Error fetching from Vélib API: {e}")
            return []
    
    def extract_historic_data(self, date_from: str, date_to: str) -> List[Dict[str, Any]]:
        """
        Extract historic station data for a date range
        
        Args:
            date_from: Start date (YYYY-MM-DD)
            date_to: End date (YYYY-MM-DD)
            
        Returns:
            List of historic station records
        """
        try:
            where_clause = f"date >= '{date_from}' AND date <= '{date_to}'"
            params = {
                'dataset': self.dataset_id,
                'where': where_clause,
                'rows': 10000,
                'timezone': 'Europe/Paris'
            }
            
            response = requests.get(self.api_base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            records = data.get('records', [])
            
            logger.info(f"Extracted {len(records)} historic records from {date_from} to {date_to}")
            return records
            
        except requests.RequestException as e:
            logger.error(f"Error fetching historic data: {e}")
            return []


class DataExtractor:
    """
    Main extractor class for Vélib API data extraction
    """
    
    def __init__(self):
        self.api_extractor = VelibAPIExtractor()
    
    def extract(self, limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Extract real-time station data from Vélib API
        
        Args:
            limit: Maximum number of records to fetch
            
        Returns:
            List of extracted records
        """
        return self.api_extractor.extract_station_data(limit)
    
    def extract_historic(self, date_from: str, date_to: str) -> List[Dict[str, Any]]:
        """
        Extract historic station data from Vélib API
        
        Args:
            date_from: Start date (YYYY-MM-DD)
            date_to: End date (YYYY-MM-DD)
            
        Returns:
            List of historic extracted records
        """
        return self.api_extractor.extract_historic_data(date_from, date_to)
