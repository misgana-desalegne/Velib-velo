#!/usr/bin/env python
"""Debug script to check API response format"""

import os
import sys
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
sys.path.insert(0, r'C:\Users\misga\OneDrive\Desktop\Projects\Projet_velib')

django.setup()

from apps.analytics.services.extractor import DataExtractor

print("=" * 60)
print("Testing API Response Format")
print("=" * 60)

extractor = DataExtractor()
records = extractor.extract(limit=2)

if records:
    print(f"\nExtracted {len(records)} records")
    print("\nFirst record structure:")
    print(json.dumps(records[0], indent=2, default=str))
else:
    print("No records extracted")
