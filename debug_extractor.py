#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Debug script to check what columns extractor provides
"""
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projet_velib.settings")
sys.path.insert(0, r"c:\Users\misga\OneDrive\Desktop\Projects\Projet_velib")
django.setup()

from apps.analytics.services.extractor import DataExtractor
import pandas as pd
import json
import logging

logging.basicConfig(level=logging.WARNING)

# Extract data
extractor = DataExtractor()
records = extractor.extract(limit=2)

print(f"\nExtracted {len(records)} records")
print(f"First record structure:")
for key in records[0]:
    print(f"  {key}: {type(records[0][key])}")

if 'fields' in records[0]:
    print(f"\nFields in first record:")
    for field_key in records[0]['fields']:
        print(f"  {field_key}")
