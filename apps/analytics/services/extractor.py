"""
Vélib API extraction service for the ETL pipeline.

Handles:
- API connection and pagination  
- Data fetching and batching
- Error handling and retries

Returns raw API records (no parsing or database operations).
For formal ETL pipeline use only.
"""

import requests
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

API_URL = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/records"


class VelibAPIExtractor:
    """
    Low-level API extraction for Vélib data.
    
    Responsibilities:
    - API connection and pagination
    - Data fetching with batching
    - Error handling and retries
    
    Returns raw API records (no parsing).
    """
    
    def __init__(self, api_url: str = API_URL, batch_size: int = 100, max_retries: int = 3, timeout: int = 30):
        self.api_url = api_url
        self.batch_size = batch_size
        self.max_retries = max_retries
        self.timeout = timeout
    
    def extract_station_data(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Fetch all stations from the Paris Open Data API.
        
        Uses pagination to retrieve all records.
        Returns list of raw station records with no parsing.
        """
        all_records = []
        offset = 0
        attempt = 0
        
        while True:
            try:
                params = {
                    'limit': self.batch_size,
                    'offset': offset,
                    'timezone': 'UTC',
                }
                
                response = requests.get(self.api_url, params=params, timeout=self.timeout)
                response.raise_for_status()
                
                data = response.json()
                records = data.get('results', [])
                
                if not records:
                    break
                
                all_records.extend(records)
                
                # Stop if we have enough records
                if limit and len(all_records) >= limit:
                    all_records = all_records[:limit]
                    break
                
                offset += self.batch_size
                attempt = 0  # Reset attempts on success
                
            except requests.exceptions.RequestException as e:
                attempt += 1
                if attempt >= self.max_retries:
                    logger.error(f"Failed to fetch data after {self.max_retries} attempts: {str(e)}")
                    break
                logger.warning(f"API error (attempt {attempt}/{self.max_retries}): {str(e)}")
                continue
        
        return all_records


class DataExtractor:
    """
    ETL pipeline extraction interface.
    
    Delegates to VelibAPIExtractor for all API operations.
    Clean abstraction for formal ETL pipeline.
    """
    
    def __init__(self):
        self.api_extractor = VelibAPIExtractor()
    
    def extract(self, limit: Optional[int] = None) -> List[Dict]:
        """Extract raw data from API."""
        return self.api_extractor.extract_station_data(limit)


__all__ = ['VelibAPIExtractor', 'DataExtractor']

