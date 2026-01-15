#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projet_velib.settings")
django.setup()

from django.core.management import call_command

# Create migrations with auto-renaming enabled
call_command('makemigrations', interactive=True)
