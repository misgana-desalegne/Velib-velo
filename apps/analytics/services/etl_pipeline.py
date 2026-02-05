"""
ETL Pipeline Orchestrator

Main pipeline that coordinates Extract, Transform, and Load operations.
Provides a unified interface for running the complete ETL process with Vélib API.
"""
import logging
from typing import Dict, List, Any, Optional
import pandas as pd
from datetime import datetime

from apps.analytics.services.extractor import DataExtractor
from apps.analytics.services.transformer import Transformer
from apps.analytics.services.loader import DataLoader

logger = logging.getLogger(__name__)


class ETLPipeline:
    """
    Orchestrates the complete ETL (Extract, Transform, Load) pipeline
    for Vélib bike sharing data processing.
    
    Usage:
        pipeline = ETLPipeline()
        result = pipeline.run()
    """
    
    def __init__(self):
        """Initialize ETL components"""
        self.extractor = DataExtractor()
        self.transformer = Transformer()
        self.loader = DataLoader()
    
    def extract(self, limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Extract phase: Retrieve real-time data from Vélib API
        
        Args:
            limit: Maximum number of records to fetch (default: 10000)
            
        Returns:
            List of raw extracted records
        """
        logger.info(f"ETL Phase 1: EXTRACTION from Vélib API (limit: {limit})")
        
        records = self.extractor.extract(limit)
        
        logger.info(f"Extraction complete: {len(records)} records extracted")
        return records
    
    def transform(self, records: List[Dict[str, Any]]) -> Dict[str, pd.DataFrame]:
        """
        Transform phase: Clean and aggregate raw data
        
        Args:
            records: Raw extracted records
            
        Returns:
            Dictionary with transformed data at different aggregation levels
        """
        logger.info("ETL Phase 2: TRANSFORMATION")
        
        if not records:
            logger.error("No records to transform")
            return {}
        
        transformed = self.transformer.transform(records)
        
        logger.info(f"Transformation complete: {len(transformed)} datasets created")
        for key, df in transformed.items():
            if isinstance(df, pd.DataFrame):
                logger.info(f"  - {key}: {len(df)} rows")
        
        return transformed
    
    def load(self, transformed_data: Dict[str, pd.DataFrame]) -> Dict[str, int]:
        """
        Load phase: Store transformed data in database
        
        Args:
            transformed_data: Transformed data dictionary
            
        Returns:
            Dictionary with load statistics
        """
        logger.info("ETL Phase 3: LOADING")
        
        if not transformed_data:
            logger.error("No transformed data to load")
            return {}
        
        result = self.loader.load(transformed_data)
        
        logger.info(f"Loading complete:")
        for key, count in result.items():
            if key != 'errors':
                logger.info(f"  - {key}: {count}")
        
        if result.get('errors'):
            logger.warning(f"Errors encountered: {result['errors']}")
        
        return result
    
    def run(self, limit: int = 10000) -> Dict[str, Any]:
        """
        Run complete ETL pipeline
        
        Args:
            limit: Maximum number of records to fetch (default: 10000)
            
        Returns:
            Dictionary with pipeline execution results
        """
        logger.info("=" * 50)
        logger.info("Starting ETL Pipeline (Vélib API)")
        logger.info("=" * 50)
        
        start_time = datetime.now()
        result = {
            'status': 'running',
            'start_time': start_time,
            'phases': {}
        }
        
        try:
            # Phase 1: Extract
            records = self.extract(limit)
            result['phases']['extract'] = {
                'status': 'success' if records else 'failed',
                'record_count': len(records)
            }
            
            if not records:
                raise Exception("Extraction failed: No records extracted")
            
            # Phase 2: Transform
            transformed = self.transform(records)
            result['phases']['transform'] = {
                'status': 'success' if transformed else 'failed',
                'datasets': list(transformed.keys()),
                'raw_rows': len(transformed.get('raw', pd.DataFrame())),
                'daily_rows': len(transformed.get('daily', pd.DataFrame())),
                'weekly_rows': len(transformed.get('weekly', pd.DataFrame())),
            }
            
            if not transformed:
                raise Exception("Transformation failed: No data transformed")
            
            # Phase 3: Load
            load_result = self.load(transformed)
            result['phases']['load'] = load_result
            
            # Summary
            result['status'] = 'success'
            result['end_time'] = datetime.now()
            result['duration_seconds'] = (result['end_time'] - start_time).total_seconds()
            
            logger.info("=" * 50)
            logger.info("ETL Pipeline Completed Successfully")
            logger.info("=" * 50)
            logger.info(f"Total Duration: {result['duration_seconds']:.2f} seconds")
            
        except Exception as e:
            logger.error(f"ETL Pipeline failed: {e}")
            result['status'] = 'failed'
            result['error'] = str(e)
            result['end_time'] = datetime.now()
            result['duration_seconds'] = (result['end_time'] - start_time).total_seconds()
        
        return result
    
    def get_pipeline_status(self, result: Dict[str, Any]) -> str:
        """
        Generate a human-readable pipeline status report
        
        Args:
            result: Pipeline execution result
            
        Returns:
            Formatted status report
        """
        status_lines = [
            "=" * 60,
            "ETL PIPELINE STATUS REPORT",
            "=" * 60,
            f"Overall Status: {result.get('status', 'unknown').upper()}",
            f"Duration: {result.get('duration_seconds', 0):.2f} seconds",
            "",
            "EXTRACTION:",
            f"  Records Extracted: {result['phases'].get('extract', {}).get('record_count', 0)}",
            "",
            "TRANSFORMATION:",
            f"  Raw Data: {result['phases'].get('transform', {}).get('raw_rows', 0)} rows",
            f"  Daily Aggregation: {result['phases'].get('transform', {}).get('daily_rows', 0)} rows",
            f"  Weekly Aggregation: {result['phases'].get('transform', {}).get('weekly_rows', 0)} rows",
            "",
            "LOADING:",
        ]
        
        load_phase = result['phases'].get('load', {})
        for key, value in load_phase.items():
            if key != 'errors':
                status_lines.append(f"  {key.replace('_', ' ').title()}: {value}")
        
        if load_phase.get('errors'):
            status_lines.append("")
            status_lines.append("ERRORS:")
            for error in load_phase['errors']:
                status_lines.append(f"  - {error}")
        
        status_lines.append("=" * 60)
        
        return "\n".join(status_lines)


# Convenience function for quick pipeline execution
def run_etl_pipeline(limit: int = 10000) -> Dict[str, Any]:
    """
    Quick function to run the ETL pipeline
    
    Args:
        limit: Maximum number of records to fetch (default: 10000)
        
    Returns:
        Pipeline execution result
        
    Example:
        result = run_etl_pipeline()
        print(result['status'])
    """
    pipeline = ETLPipeline()
    return pipeline.run(limit=limit)
