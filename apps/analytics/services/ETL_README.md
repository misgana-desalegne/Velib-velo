# ETL Pipeline Documentation

## Overview

The ETL (Extract, Transform, Load) pipeline is a complete data processing system for Vélib bike sharing data. It extracts real-time data from the Vélib API, transforms it using pandas for analysis and aggregation, and loads it into the Django database.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ETL PIPELINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐      ┌──────────────┐      ┌──────────────┐│
│  │  EXTRACTOR  │  →   │ TRANSFORMER  │  →   │    LOADER    ││
│  │             │      │              │      │              ││
│  │ • Vélib API │      │ • Cleaner    │      │ • Communes   ││
│  │             │      │ • Validator  │      │ • Stations   ││
│  │             │      │ • Aggregator │      │ • Statuses   ││
│  │             │      │ • Calculator │      │ • Analytics  ││
│  └─────────────┘      └──────────────┘      └──────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Files

#### Extraction (`extractor.py`)
- **VelibAPIExtractor**: Extracts real-time and historic data from Vélib API
- **DataExtractor**: Main interface for API data extraction

#### Transformation (`transformer.py`)
- **DataCleaner**: Cleans raw data, standardizes columns, removes duplicates
- **DataTransformer**: Performs aggregations, calculations, and classifications
- **Transformer**: Main orchestrator for all transformation operations

#### Loading (`loader.py`)
- **CommuneLoader**: Loads commune/city data
- **BikeStationLoader**: Loads bike station details
- **StationStatusLoader**: Loads real-time station snapshots
- **DailyAnalyticsLoader**: Loads daily aggregated analytics
- **WeeklyAnalyticsLoader**: Loads weekly aggregated analytics
- **DataLoader**: Main orchestrator for all loading operations

#### Pipeline (`etl_pipeline.py`)
- **ETLPipeline**: Main orchestrator for the complete ETL process
- Provides high-level interface for running the full pipeline
- Handles error management and status reporting

## Usage

### Method 1: Django Management Command (Recommended)

```bash
# Run with default limit (10000 records)
python manage.py run_etl_pipeline

# Run with custom limit
python manage.py run_etl_pipeline --limit 5000

# Enable verbose logging
python manage.py run_etl_pipeline --limit 10000 --verbose
```

### Method 2: Direct Python

```python
from apps.analytics.services.etl_pipeline import ETLPipeline

# Create pipeline instance
pipeline = ETLPipeline()

# Run with default limit
result = pipeline.run()

# Run with custom limit
result = pipeline.run(limit=5000)

# Display status
print(pipeline.get_pipeline_status(result))
```

### Method 3: Convenience Function

```python
from apps.analytics.services.etl_pipeline import run_etl_pipeline

result = run_etl_pipeline(limit=10000)
print(result['status'])
```

## Data Flow

### Phase 1: Extraction

Real-time data is extracted from the **Vélib OpenData API**:
- Endpoint: `https://opendata.paris.fr/api/records/1.0/search`
- Dataset: `velib-disponibilite-en-temps-reel`
- Data: Station availability snapshots (available bikes and docks)

### Phase 2: Transformation

Raw data is processed through:

1. **Cleaning**
   - Column name standardization
   - Data type conversion
   - Duplicate removal
   - Missing value handling

2. **Validation**
   - Range checking (coordinates, bike counts)
   - Negative value detection
   - Data quality assessment

3. **Enhancement**
   - Utilization rate calculation
   - Hourly delta calculation
   - Signal analysis metrics

4. **Aggregation**
   - Daily summaries (mean, min, max, std)
   - Weekly summaries
   - Station classification

### Phase 3: Loading

Transformed data is loaded into Django models:

1. **Communes** - City/administrative data
2. **BikeStations** - Static station information
3. **StationStatus** - Real-time snapshots
4. **DailyAnalytics** - Daily aggregated metrics
5. **WeeklyAnalytics** - Weekly aggregated metrics

## Data Model Integration

The ETL pipeline populates the following Django models (from `models.py`):

```
Commune (parent)
  ├── BikeStation
  │   ├── StationStatus (real-time)
  │   ├── DailyAnalytics
  │   └── WeeklyAnalytics
```

### Key Metrics Calculated

- **Utilization Rate**: Percentage of available bikes
- **Hourly Delta**: Change in bike count per hour
- **Net Flux**: Sum of all hourly deltas (Source/Sink indicator)
- **Shannon Entropy**: Station predictability measure
- **Persistence**: Hours at 100% capacity or 0% capacity

## Output Format

### Pipeline Result Structure

```python
{
    'status': 'success',  # or 'failed'
    'start_time': datetime,
    'end_time': datetime,
    'duration_seconds': 15.23,
    'phases': {
        'extract': {
            'status': 'success',
            'record_count': 1500
        },
        'transform': {
            'status': 'success',
            'datasets': ['raw', 'daily', 'weekly'],
            'raw_rows': 1500,
            'daily_rows': 50,
            'weekly_rows': 10
        },
        'load': {
            'communes': 5,
            'stations': 200,
            'statuses': 1500,
            'daily_analytics': 50,
            'weekly_analytics': 10,
            'errors': []
        }
    },
    'error': None  # Error message if failed
}
```

## Configuration

### API Configuration

Modify API settings in `VelibAPIExtractor.__init__()`:
- API Base URL: `https://opendata.paris.fr/api/records/1.0/search`
- Dataset ID: `velib-disponibilite-en-temps-reel`
- Timezone: `Europe/Paris`

### Data Cleaner Configuration

Modify standardization rules in `DataCleaner.clean_station_records()`:
- Column name mappings
- Data type conversions
- Validation thresholds

### Transformation Configuration

Adjust calculations in `DataTransformer`:
- Aggregation functions (mean, min, max, std)
- Utilization thresholds
- Classification rules

### Loader Configuration

Set batch sizes in loader classes:
- Default: 1000 records per batch
- Modify `batch_size` parameter in load methods

## Error Handling

The pipeline includes comprehensive error handling:

- **Extraction errors**: Logged, graceful failure with message
- **Transformation errors**: Row-level errors logged, processing continues
- **Loading errors**: Transaction rollback, detailed error logging
- **Invalid data**: Automatically filtered out during validation

## Logging

All pipeline operations are logged using Python's `logging` module:

```python
import logging
logger = logging.getLogger(__name__)
```

Configure logging level:

```python
import logging
logging.basicConfig(level=logging.INFO)  # or DEBUG for verbose
```

## Performance Considerations

- **Batch Operations**: Uses `bulk_create()` for efficient database insertion
- **Transaction Management**: Uses `@transaction.atomic` decorator
- **Indexing**: Database indexes on timestamp and station fields
- **Deduplication**: Removes duplicate records during cleaning

### Typical Performance

- Extraction: ~1-5 seconds (API)
- Transformation: ~2-10 seconds
- Loading: ~5-30 seconds

**Total**: ~10-45 seconds per run

## Examples

### Example 1: Run Daily Pipeline via Cron

```bash
# Add to crontab (runs at 2 AM daily)
0 2 * * * cd /path/to/project && python manage.py run_etl_pipeline --limit 10000
```

### Example 2: Run with Custom Limit

```bash
# Extract first 5000 records only
python manage.py run_etl_pipeline --limit 5000
```

### Example 3: Custom Processing

```python
from apps.analytics.services.etl_pipeline import ETLPipeline

pipeline = ETLPipeline()

# Extract
records = pipeline.extract(limit=5000)

# Transform
transformed = pipeline.transform(records)

# Additional custom processing
df_daily = transformed['daily']
df_weekly = transformed['weekly']

# Your custom analysis
print(df_daily[['date', 'station_id', 'avg_utilization']].head())

# Load
result = pipeline.load(transformed)
```

## Troubleshooting

### Issue: "No records extracted"
- Check internet connectivity to Vélib API
- Verify API endpoint is accessible
- Check API rate limiting

### Issue: "Validation failed: Invalid coordinates"
- Coordinates outside range [-90, 90] for lat, [-180, 180] for lon
- Check data from API for coordinate format issues

### Issue: "Database transaction failed"
- Check database connection
- Ensure Django models are properly migrated
- Review transaction logs for constraint violations

### Issue: "KeyError: Column not found"
- Verify API response format is correct
- Update column mappings in `DataCleaner` if API format changed

## Dependencies

Required packages:
- `pandas`: Data manipulation and analysis
- `requests`: HTTP requests for API
- `django`: Web framework and ORM
- `numpy`: Numerical computations

Install with:
```bash
pip install pandas requests django numpy
```

## Future Enhancements

- [ ] Real-time streaming ingestion
- [ ] Advanced ML-based station classification
- [ ] Predictive analytics for bike availability
- [ ] Geographic clustering analysis
- [ ] Anomaly detection for maintenance alerts
