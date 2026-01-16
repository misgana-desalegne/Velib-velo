import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')

try:
    django.setup()
    print("Django setup successful")
    
    # Check if database is accessible
    from django.core.management import call_command
    from django.db import connection
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("✓ Database is accessible")
    
    # Check if there are any migration issues
    from django.apps import apps
    from django.db.migrations.loader import MigrationLoader
    
    loader = MigrationLoader(None, ignore_no_migrations=True)
    print(f"✓ Found {len(loader.disk_migrations)} migrations")
    
    # Try to create a test user
    from django.contrib.auth.models import User
    
    # Check if test user exists
    test_user = User.objects.filter(username='testuser').first()
    if test_user:
        print(f"✓ Test user exists: {test_user.email}")
    else:
        # Create a test user for testing
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        print(f"✓ Created test user: {user.email}")
    
    print("\n✓ Backend is ready to run!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
