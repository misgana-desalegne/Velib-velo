#!/usr/bin/env python
"""Debug script to test transformer"""

import os
import sys
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
sys.path.insert(0, r'C:\Users\misga\OneDrive\Desktop\Projects\Projet_velib')

django.setup()

from apps.analytics.services.extractor import DataExtractor
from apps.analytics.services.transformer import Transformer

print("=" * 60)
print("Testing ETL Transformer")
print("=" * 60)

try:
    # Extract
    extractor = DataExtractor()
    records = extractor.extract(limit=10)
    print(f"\n✓ Extracted {len(records)} records")
    
    # Transform
    transformer = Transformer()
    print(f"\nStarting transformation...")
    result = transformer.transform(records)
    
    print(f"✓ Transformation successful!")
    for key, df in result.items():
        print(f"  - {key}: {len(df)} rows")
    
except Exception as e:
    print(f"\n✗ Error during transformation:")
    print(f"  {e}")
    traceback.print_exc()
