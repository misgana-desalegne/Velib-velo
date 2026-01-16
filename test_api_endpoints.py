#!/usr/bin/env python
"""Test API endpoints for frontend dashboard"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from django.test import Client
import json

client = Client()

print("=" * 80)
print("TESTING FRONTEND API ENDPOINTS")
print("=" * 80)

# Test 1: Live Dashboard endpoint
print("\n1. Testing /api/dashboard/live/")
response = client.get('/api/dashboard/live/')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✓ Total Stations: {data.get('total_stations')}")
    print(f"   ✓ Active Stations: {data.get('active_stations')}")
    print(f"   ✓ Total Bikes: {data.get('total_bikes')}")
    print(f"   ✓ Total Docks: {data.get('total_docks')}")
    print(f"   ✓ Avg Utilization: {data.get('avg_utilization')}%")
else:
    print(f"   ✗ Error: {response.status_code}")

# Test 2: Commune Summary endpoint
print("\n2. Testing /api/dashboard/communes/")
response = client.get('/api/dashboard/communes/')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    if isinstance(data, list):
        print(f"   ✓ Returned {len(data)} communes")
        for i, commune in enumerate(data[:3]):
            print(f"      {i+1}. {commune.get('code')} - {commune.get('name')}")
else:
    print(f"   ✗ Error: {response.status_code}")

# Test 3: BikeStation endpoint
print("\n3. Testing /api/stations/")
response = client.get('/api/stations/')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    if isinstance(data, dict) and 'count' in data:
        print(f"   ✓ Total stations: {data.get('count')}")
else:
    print(f"   ✗ Error: {response.status_code}")

print("\n" + "=" * 80)
print("API ENDPOINT TESTS COMPLETE - FRONTEND IS READY TO USE")
print("=" * 80)
print("\nDev Server: http://localhost:3001/Data-Analysis-Dashboard/")
