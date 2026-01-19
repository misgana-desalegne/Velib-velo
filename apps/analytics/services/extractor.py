"""
Data Extraction Module (Simplified)

Unified interface for extracting bike station data from Vélib API.
Delegates to VelibDataIngestionService which handles actual extraction and parsing.

Part of ETL Pipeline Architecture:
    ETL Pipeline -> DataExtractor -> VelibDataIngestionService
"""
from typing import Dict, List, Any
import logging

from apps.analytics.services.velib_data_ingestion import VelibDataIngestionService

logger = logging.getLogger(__name__)


class DataExtractor:
    """
    Unified extractor for ETL Pipeline - simplified wrapper.
    Delegates to VelibDataIngestionService for actual API calls and parsing.
    """
    
    def extract(self, limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Extract real-time station data from Vélib API
        
        Args:
            limit: Maximum number of records to fetch
            
        Returns:
            List of extracted and parsed records ready for transformation
        """
        logger.info(f"Extracting data with limit: {limit}")
        records = VelibDataIngestionService.fetch_all_stations(limit)
        logger.info(f"Extraction complete: {len(records)} records")
        return records
