import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet_velib.settings')
django.setup()

from apps.analytics.services.arrondissement_service import CommuneService

if __name__ == '__main__':
    try:
        results = CommuneService.get_all_communes_summary()
        print('SUCCESS: fetched', len(results), 'commune summaries')
        if results:
            import json
            print(json.dumps(results[0], default=str, indent=2))
    except Exception:
        print('ERROR: exception when fetching commune summaries')
        traceback.print_exc()
