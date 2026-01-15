#!/usr/bin/env python
"""
Debug script to check what columns are produced by transformer
"""
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projet_velib.settings")
sys.path.insert(0, r"c:\Users\misga\OneDrive\Desktop\Projects\Projet_velib")
django.setup()

from apps.analytics.services.extractor import DataExtractor
from apps.analytics.services.transformer import Transformer
import logging

logging.basicConfig(level=logging.INFO)

# Extract data
extractor = DataExtractor()
records = extractor.extract(limit=10)

print(f"\n✓ Extracted {len(records)} records")
print(f"First record keys: {records[0].keys()}")

# Transform data
transformer = Transformer()
transformed = transformer.transform(records)

print(f"\n✓ Transformed data into {len(transformed)} datasets")

for dataset_name, df in transformed.items():
    print(f"\n{dataset_name.upper()}:")
    print(f"  Shape: {df.shape}")
    print(f"  Columns: {list(df.columns)}")
    print(f"  First row:\n{df.iloc[0] if len(df) > 0 else 'No data'}")
