"""
Data Transformation Module

Transforms raw extracted data into analysis-ready format using pandas.
Performs cleaning, validation, and aggregation of bike station data.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class DataCleaner:
    """Clean and validate raw data"""
    
    @staticmethod
    def clean_station_records(records: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Clean raw station records into a standardized DataFrame
        
        Args:
            records: List of raw station records
            
        Returns:
            Cleaned pandas DataFrame
        """
        if not records:
            logger.warning("No records to clean")
            return pd.DataFrame()
        
        # Flatten nested records from API if needed
        flattened = []
        for record in records:
            if isinstance(record, dict):
                # Handle API response format with 'fields'
                if 'fields' in record:
                    row = record['fields'].copy()
                    # Add geometry/coordinates if available
                    if 'geometry' in record:
                        row['_geometry'] = record['geometry']
                    flattened.append(row)
                else:
                    flattened.append(record)
        
        df = pd.DataFrame(flattened)
        
        # Standardize column names
        column_mapping = {
            'stationcode': 'station_id',
            'station_code': 'station_id',
            'name': 'station_name',
            'nom_station': 'station_name',
            'duedate': 'timestamp',
            'record_timestamp': 'timestamp',
            'numbikesavailable': 'available_bikes',
            'numdocksavailable': 'available_docks',
            'dockavail': 'available_docks',
            'dock_avail': 'available_docks',
            'docksavailable': 'available_docks',
            'nbebikesavail': 'available_bikes',
            'nb_ebikes_avail': 'available_bikes',
            'bikestavailable': 'available_bikes',
            'geom': 'geometry',
            'geo_point_2d': 'geometry',
            'coordonnees_geo': 'coordinates',
            'commune': 'commune_name',
            'libelle_commune': 'commune_name',
            'code_insee_commune': 'commune_code',
            'arrondissement': 'arrondissement_name',
            'libelle_arrondissement': 'arrondissement_name',
            'nom_arrondissement_communes': 'commune_name',
        }
        
        df.rename(columns=column_mapping, inplace=True)
        
        # Extract latitude and longitude from coordinates if needed
        if 'coordinates' in df.columns and 'latitude' not in df.columns:
            # Handle list format [lat, lon]
            coords = df['coordinates'].apply(lambda x: x if isinstance(x, (list, tuple)) and len(x) == 2 else None)
            df['latitude'] = coords.apply(lambda x: x[0] if x else None)
            df['longitude'] = coords.apply(lambda x: x[1] if x else None)
        
        # Convert numeric columns
        numeric_cols = ['available_bikes', 'available_docks', 'latitude', 'longitude', 'capacity', 'ebike', 'mechanical']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Parse timestamp if present
        timestamp_cols = ['timestamp', 'time', 'date', 'duedate', 'last_update', 'record_timestamp']
        for col in timestamp_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce', utc=True)
        
        # Drop columns with non-hashable types (like lists) before drop_duplicates
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    # Try to check if the column contains unhashable types
                    sample = df[col].dropna().iloc[0] if len(df[col].dropna()) > 0 else None
                    if isinstance(sample, (list, dict)):
                        df = df.drop(col, axis=1)
                        logger.debug(f"Dropped unhashable column: {col}")
                except (IndexError, TypeError):
                    pass
        
        # Remove complete duplicates
        df = df.drop_duplicates()
        
        # Remove rows with critical missing values
        critical_cols = ['station_id', 'available_bikes', 'available_docks']
        df = df.dropna(subset=[col for col in critical_cols if col in df.columns], how='any')
        
        logger.info(f"Cleaned {len(df)} records")
        return df
    
    @staticmethod
    def validate_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """
        Validate data quality and flag issues
        
        Args:
            df: DataFrame to validate
            
        Returns:
            Tuple of (cleaned_df, list_of_issues)
        """
        issues = []
        df_copy = df.copy()
        
        # Check for negative values
        if 'available_bikes' in df.columns:
            negative_bikes = df_copy[df_copy['available_bikes'] < 0].shape[0]
            if negative_bikes > 0:
                issues.append(f"Found {negative_bikes} records with negative bikes")
                df_copy = df_copy[df_copy['available_bikes'] >= 0]
        
        if 'available_docks' in df.columns:
            negative_docks = df_copy[df_copy['available_docks'] < 0].shape[0]
            if negative_docks > 0:
                issues.append(f"Found {negative_docks} records with negative docks")
                df_copy = df_copy[df_copy['available_docks'] >= 0]
        
        # Check for invalid coordinates
        if 'latitude' in df.columns and 'longitude' in df.columns:
            invalid_coords = df_copy[
                (df_copy['latitude'].abs() > 90) | (df_copy['longitude'].abs() > 180)
            ].shape[0]
            if invalid_coords > 0:
                issues.append(f"Found {invalid_coords} records with invalid coordinates")
                df_copy = df_copy[
                    (df_copy['latitude'].abs() <= 90) & (df_copy['longitude'].abs() <= 180)
                ]
        
        if issues:
            logger.warning(f"Validation issues found: {issues}")
        
        return df_copy, issues


class DataTransformer:
    """Transform cleaned data into analytics-ready format"""
    
    @staticmethod
    def calculate_utilization_rate(df: pd.DataFrame) -> pd.Series:
        """
        Calculate utilization rate (percentage of available bikes)
        
        Args:
            df: DataFrame with available_bikes and available_docks
            
        Returns:
            Series with utilization rates (0-100)
        """
        total = df['available_bikes'] + df['available_docks']
        utilization = (df['available_bikes'] / total * 100).fillna(0)
        return utilization.round(2)
    
    @staticmethod
    def aggregate_daily(df: pd.DataFrame, station_col: str = 'station_id', 
                       date_col: str = 'timestamp') -> pd.DataFrame:
        """
        Aggregate data to daily level
        
        Args:
            df: DataFrame with station data
            station_col: Column name for station identifier
            date_col: Column name for timestamp
            
        Returns:
            Daily aggregated DataFrame
        """
        if date_col not in df.columns:
            logger.error(f"Date column '{date_col}' not found")
            return pd.DataFrame()
        
        df_copy = df.copy()
        df_copy[date_col] = pd.to_datetime(df_copy[date_col])
        df_copy['date'] = df_copy[date_col].dt.date
        
        # Group by date and station
        daily_agg = df_copy.groupby(['date', station_col]).agg({
            'available_bikes': ['mean', 'min', 'max', 'std'],
            'available_docks': ['mean', 'min', 'max', 'std'],
        }).reset_index()
        
        daily_agg.columns = ['date', station_col, 
                             'avg_available_bikes', 'min_available_bikes', 'max_available_bikes', 'std_available_bikes',
                             'avg_available_docks', 'min_available_docks', 'max_available_docks', 'std_available_docks']
        
        # Calculate average utilization
        daily_agg['avg_utilization'] = (
            daily_agg['avg_available_bikes'] / 
            (daily_agg['avg_available_bikes'] + daily_agg['avg_available_docks']) * 100
        ).round(2)
        
        logger.info(f"Aggregated to {len(daily_agg)} daily records")
        return daily_agg
    
    @staticmethod
    def aggregate_weekly(df: pd.DataFrame, station_col: str = 'station_id',
                        date_col: str = 'timestamp') -> pd.DataFrame:
        """
        Aggregate data to weekly level
        
        Args:
            df: DataFrame with station data
            station_col: Column name for station identifier
            date_col: Column name for timestamp
            
        Returns:
            Weekly aggregated DataFrame
        """
        if date_col not in df.columns:
            logger.error(f"Date column '{date_col}' not found")
            return pd.DataFrame()
        
        df_copy = df.copy()
        df_copy[date_col] = pd.to_datetime(df_copy[date_col])
        df_copy['week_start'] = df_copy[date_col].dt.to_period('W').apply(lambda r: r.start_time)
        
        # Group by week and station
        weekly_agg = df_copy.groupby(['week_start', station_col]).agg({
            'available_bikes': ['mean', 'min', 'max', 'std'],
            'available_docks': ['mean', 'min', 'max', 'std'],
        }).reset_index()
        
        weekly_agg.columns = ['week_start_date', station_col,
                              'avg_available_bikes', 'min_available_bikes', 'max_available_bikes', 'std_available_bikes',
                              'avg_available_docks', 'min_available_docks', 'max_available_docks', 'std_available_docks']
        
        # Calculate average utilization
        weekly_agg['avg_utilization'] = (
            weekly_agg['avg_available_bikes'] / 
            (weekly_agg['avg_available_bikes'] + weekly_agg['avg_available_docks']) * 100
        ).round(2)
        
        logger.info(f"Aggregated to {len(weekly_agg)} weekly records")
        return weekly_agg
    
    @staticmethod
    def calculate_hourly_delta(df: pd.DataFrame, station_col: str = 'station_id',
                               timestamp_col: str = 'timestamp') -> pd.DataFrame:
        """
        Calculate hourly change in available bikes (signal analysis)
        
        Args:
            df: DataFrame with station data
            station_col: Column name for station identifier
            timestamp_col: Column name for timestamp
            
        Returns:
            DataFrame with hourly deltas
        """
        df_copy = df.copy()
        df_copy[timestamp_col] = pd.to_datetime(df_copy[timestamp_col])
        df_copy = df_copy.sort_values([station_col, timestamp_col])
        
        # Calculate delta for each station
        df_copy['hourly_delta'] = df_copy.groupby(station_col)['available_bikes'].diff()
        
        logger.info(f"Calculated hourly deltas for {df_copy[station_col].nunique()} stations")
        return df_copy
    
    @staticmethod
    def classify_stations(df: pd.DataFrame, station_col: str = 'station_id') -> pd.DataFrame:
        """
        Classify stations by their behavior (source, sink, ghost, balanced)
        
        Args:
            df: DataFrame with aggregated data and deltas
            station_col: Column name for station identifier
            
        Returns:
            DataFrame with station classifications
        """
        df_copy = df.copy()
        
        classifications = []
        for station in df_copy[station_col].unique():
            station_data = df_copy[df_copy[station_col] == station]
            
            # Calculate net flux (sum of hourly deltas)
            if 'hourly_delta' in station_data.columns:
                net_flux = station_data['hourly_delta'].sum()
            else:
                net_flux = 0
            
            # Calculate entropy (variability)
            if 'available_bikes' in station_data.columns:
                bikes_std = station_data['available_bikes'].std()
                bikes_mean = station_data['available_bikes'].mean()
                entropy = bikes_std / (bikes_mean + 1) if bikes_mean > 0 else 0
            else:
                entropy = 0
            
            # Classify
            if entropy < 0.3 and station_data['available_bikes'].mean() < 2:
                classification = 'ghost_station'
            elif net_flux > 10:
                classification = 'source'
            elif net_flux < -10:
                classification = 'sink'
            else:
                classification = 'balanced'
            
            classifications.append({
                station_col: station,
                'classification': classification,
                'net_flux': net_flux,
                'entropy': entropy
            })
        
        class_df = pd.DataFrame(classifications)
        logger.info(f"Classified {len(class_df)} stations")
        return class_df


class Transformer:
    """
    Main transformer class coordinating all transformation steps
    """
    
    def __init__(self):
        self.cleaner = DataCleaner()
        self.transformer = DataTransformer()
    
    def transform(self, records: List[Dict[str, Any]]) -> Dict[str, pd.DataFrame]:
        """
        Complete transformation pipeline
        
        Args:
            records: Raw extracted records
            
        Returns:
            Dictionary with various aggregation levels
        """
        logger.info("Starting transformation pipeline")
        
        # Step 1: Clean data
        df_clean = self.cleaner.clean_station_records(records)
        if df_clean.empty:
            logger.error("No data after cleaning")
            return {}
        
        # Step 2: Validate data
        df_clean, issues = self.cleaner.validate_data(df_clean)
        if df_clean.empty:
            logger.error("No data after validation")
            return {}
        
        # Step 3: Add utilization rate
        if 'available_bikes' in df_clean.columns and 'available_docks' in df_clean.columns:
            df_clean['utilization_rate'] = self.transformer.calculate_utilization_rate(df_clean)
        
        # Step 4: Calculate deltas for signal analysis
        if 'timestamp' in df_clean.columns:
            df_clean = self.transformer.calculate_hourly_delta(df_clean)
        
        # Step 5: Create aggregations
        result = {'raw': df_clean}
        
        if 'timestamp' in df_clean.columns:
            result['daily'] = self.transformer.aggregate_daily(df_clean)
            result['weekly'] = self.transformer.aggregate_weekly(df_clean)
        
        logger.info("Transformation pipeline completed successfully")
        return result
