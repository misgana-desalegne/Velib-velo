# ETL Pipeline Scheduler Configuration
# Add these settings to your Django settings.py file

# Enable/disable the ETL scheduler
ETL_SCHEDULER_ENABLED = True

# Interval between ETL runs (in hours)
# Set to 1 for hourly runs (default: 1)
ETL_SCHEDULER_INTERVAL_HOURS = 1

# Maximum number of records to extract per run
# Set to 10000 to get all available data (default: 10000)
ETL_SCHEDULER_RECORD_LIMIT = 10000

# Example configurations:
# 
# Run every 30 minutes:
# ETL_SCHEDULER_INTERVAL_HOURS = 0.5
#
# Run every 6 hours:
# ETL_SCHEDULER_INTERVAL_HOURS = 6
#
# Run every 24 hours (daily):
# ETL_SCHEDULER_INTERVAL_HOURS = 24
#
# Extract only first 5000 records:
# ETL_SCHEDULER_RECORD_LIMIT = 5000
