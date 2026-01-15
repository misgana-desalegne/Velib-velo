#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projet_velib.settings")
sys.path.insert(0, r"c:\Users\misga\OneDrive\Desktop\Projects\Projet_velib")

django.setup()

# Now run the commands
from django.core.management import call_command

try:
    print("Applying migrations...")
    call_command('migrate')
    print("Migrations applied successfully!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
