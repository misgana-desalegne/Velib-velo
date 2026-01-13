#!/usr/bin/env python
"""Test script to verify ETL scheduler is working"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
sys.path.insert(0, r'C:\Users\misga\OneDrive\Desktop\Projects\Projet_velib')

django.setup()

from apps.analytics.services.etl_scheduler import get_scheduler_status

print("=" * 60)
print("ETL SCHEDULER STATUS TEST")
print("=" * 60)

try:
    status = get_scheduler_status()
    print(f"\n✓ Scheduler Status Check Successful")
    print(f"  Running: {status['running']}")
    print(f"  Number of Jobs: {len(status['jobs'])}")
    
    if status['jobs']:
        print(f"\n  Active Jobs:")
        for job in status['jobs']:
            print(f"    - Name: {job['name']}")
            print(f"      ID: {job['id']}")
            print(f"      Next Run: {job['next_run_time']}")
            print(f"      Trigger: {job['trigger']}")
    else:
        print(f"\n  No active jobs")
    
    print("\n" + "=" * 60)
    if status['running']:
        print("✓ SCHEDULER IS RUNNING - Everything looks good!")
    else:
        print("⚠ SCHEDULER IS NOT RUNNING - Starting it...")
        from apps.analytics.services.etl_scheduler import start_etl_scheduler
        start_etl_scheduler()
        print("✓ Scheduler started!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n✗ Error checking scheduler status:")
    print(f"  {e}")
    import traceback
    traceback.print_exc()
