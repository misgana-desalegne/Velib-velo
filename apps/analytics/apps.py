import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.analytics'
    
    def ready(self):
        """
        Initialize app-level settings when Django starts
        Starts the ETL pipeline scheduler
        """
        try:
            from apps.analytics.services.etl_scheduler import start_etl_scheduler
            start_etl_scheduler()
        except Exception as e:
            logger.error(f"Failed to initialize ETL scheduler: {e}")
