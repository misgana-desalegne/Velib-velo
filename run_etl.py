#!/usr/bin/env python
"""
ETL Pipeline Execution Script

Runs the complete ETL pipeline: Extract, Transform, and Load Vélib data
"""
import os
import sys
import django
import json
from datetime import datetime

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projet_velib.settings")
sys.path.insert(0, r"c:\Users\misga\OneDrive\Desktop\Projects\Projet_velib")
django.setup()

# Import after Django setup
from apps.analytics.services.etl_pipeline import ETLPipeline
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Run the ETL pipeline"""
    try:
        pipeline = ETLPipeline()
        
        # Run ETL to load all stations from API (approximately 1500)
        result = pipeline.run()
        
        # Print results
        print("\n" + "="*60)
        print("ETL PIPELINE EXECUTION RESULTS")
        print("="*60)
        
        print(f"Status: {result.get('status')}")
        print(f"Start Time: {result.get('start_time')}")
        print(f"End Time: {result.get('end_time')}")
        print(f"Duration: {result.get('duration')}")
        
        print("\nPhase Results:")
        for phase, phase_result in result.get('phases', {}).items():
            print(f"\n{phase.upper()}:")
            for key, value in phase_result.items():
                print(f"  {key}: {value}")
        
        print("\nLoad Statistics:")
        for key, count in result.get('load_stats', {}).items():
            if key != 'errors':
                print(f"  {key}: {count}")
        
        if result.get('load_stats', {}).get('errors'):
            print(f"  Errors: {result['load_stats']['errors']}")
        
        print("="*60)
        
        # Return exit code based on status
        return 0 if result.get('status') == 'success' else 1
        
    except Exception as e:
        logger.error(f"ETL Pipeline failed: {str(e)}")
        print(f"\nERROR: {str(e)}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
