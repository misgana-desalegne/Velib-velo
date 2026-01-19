"""
DEPRECATED: This command has been consolidated.

Use 'python manage.py populate_example_data' instead.
This command is kept for backward compatibility only.
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'DEPRECATED: Use populate_example_data instead'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING(
            '\nDEPRECATED: populate_data command is deprecated.\n'
            'Use: python manage.py populate_example_data\n'
        ))
        
        # Redirect to the new command
        self.stdout.write('Redirecting to populate_example_data...\n')
        call_command('populate_example_data', *args, **kwargs)

