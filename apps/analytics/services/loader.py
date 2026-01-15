"""
Data Loading Module

Loads transformed data into the database (Django models).
Handles bulk operations and transaction management.
"""
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, date
from decimal import Decimal
import logging
from django.db import transaction
from django.utils import timezone

from apps.analytics.models import (
    Commune, BikeStation, StationStatus, DailyAnalytics, WeeklyAnalytics
)

logger = logging.getLogger(__name__)


class CommuneLoader:
    """Load commune data into database"""
    
    @staticmethod
    def load_communes(df: pd.DataFrame, code_col: str = 'code_insee_commune',
                     name_col: str = 'nom_arrondissement_communes') -> Dict[str, int]:
        """
        Load or update communes from DataFrame
        
        Args:
            df: DataFrame with commune data
            code_col: Column name for commune code
            name_col: Column name for commune name
            
        Returns:
            Dictionary mapping commune codes to IDs
        """
        communes_dict = {}
        
        # Check if columns exist in dataframe
        if code_col not in df.columns or name_col not in df.columns:
            logger.warning(f"Commune columns not found in DataFrame. Expected: {code_col}, {name_col}")
            logger.info("Creating default Paris commune")
            # Create default commune for Paris
            commune, _ = Commune.objects.get_or_create(
                code='75056',
                defaults={'name': 'Paris', 'population': 2161000}
            )
            communes_dict['75056'] = commune.id
            return communes_dict
        
        # Extract unique communes
        commune_data = df[[code_col, name_col]].drop_duplicates()
        
        for _, row in commune_data.iterrows():
            code = str(row[code_col]).strip() if pd.notna(row[code_col]) else None
            name = str(row[name_col]).strip() if pd.notna(row[name_col]) else None
            
            if not code or not name:
                continue
            
            try:
                commune, created = Commune.objects.get_or_create(
                    code=code,
                    defaults={'name': name, 'population': 0}
                )
                communes_dict[code] = commune.id
                
                if created:
                    logger.info(f"Created commune: {code} - {name}")
                    
            except Exception as e:
                logger.error(f"Error loading commune {code}: {e}")
        
        logger.info(f"Loaded {len(communes_dict)} communes")
        return communes_dict


class BikeStationLoader:
    """Load bike station data into database"""
    
    @staticmethod
    def load_stations(df: pd.DataFrame, communes_dict: Dict[str, int],
                     station_id_col: str = 'stationcode',
                     name_col: str = 'name',
                     lat_col: str = 'latitude',
                     lon_col: str = 'longitude',
                     capacity_col: str = 'capacity',
                     commune_code_col: str = 'code_insee_commune',
                     mechanical_col: str = 'mechanical',
                     electric_col: str = 'ebike',
                     is_installed_col: str = 'is_installed',
                     is_renting_col: str = 'is_renting',
                     is_returning_col: str = 'is_returning') -> Dict[str, int]:
        """
        Load or update bike stations from DataFrame
        
        Args:
            df: DataFrame with station data
            communes_dict: Dictionary mapping commune codes to IDs
            station_id_col: Column name for station ID
            name_col: Column name for station name
            lat_col: Column name for latitude
            lon_col: Column name for longitude
            capacity_col: Column name for capacity/total_docks
            commune_code_col: Column name for commune code
            mechanical_col: Column name for mechanical bikes count
            electric_col: Column name for electric bikes count
            is_installed_col: Column name for installation status
            is_renting_col: Column name for renting status
            is_returning_col: Column name for returning status
            
        Returns:
            Dictionary mapping station IDs to model IDs
        """
        stations_dict = {}
        
        # Extract unique stations - only use columns that exist
        station_cols = [station_id_col]
        if name_col in df.columns:
            station_cols.append(name_col)
        if lat_col in df.columns:
            station_cols.append(lat_col)
        if lon_col in df.columns:
            station_cols.append(lon_col)
        if capacity_col in df.columns:
            station_cols.append(capacity_col)
        if mechanical_col in df.columns:
            station_cols.append(mechanical_col)
        if electric_col in df.columns:
            station_cols.append(electric_col)
        if is_installed_col in df.columns:
            station_cols.append(is_installed_col)
        if is_renting_col in df.columns:
            station_cols.append(is_renting_col)
        if is_returning_col in df.columns:
            station_cols.append(is_returning_col)
        
        # Filter to only existing columns
        available_cols = [col for col in station_cols if col in df.columns]
        
        if station_id_col not in available_cols:
            logger.error(f"Station ID column '{station_id_col}' not found in DataFrame")
            return stations_dict
            
        station_data = df[available_cols].drop_duplicates(subset=[station_id_col])
        
        for _, row in station_data.iterrows():
            station_id = str(row[station_id_col]).strip() if station_id_col in station_data.columns else None
            if not station_id:
                continue
                
            name = str(row[name_col]).strip() if name_col in station_data.columns and pd.notna(row[name_col]) else f'Station {station_id}'
            
            try:
                latitude = float(row[lat_col]) if lat_col in station_data.columns and pd.notna(row[lat_col]) else None
                longitude = float(row[lon_col]) if lon_col in station_data.columns and pd.notna(row[lon_col]) else None
                
                # Use default coordinates for Paris if missing
                if not latitude or not longitude:
                    latitude = 48.8566
                    longitude = 2.3522
                    logger.debug(f"Using default Paris coordinates for station {station_id}")
                
                # Get capacity
                capacity = int(row[capacity_col]) if capacity_col in df.columns and pd.notna(row.get(capacity_col)) else 0
                
                # Get bike counts
                mechanical = int(row[mechanical_col]) if mechanical_col in df.columns and pd.notna(row.get(mechanical_col)) else 0
                electric = int(row[electric_col]) if electric_col in df.columns and pd.notna(row.get(electric_col)) else 0
                
                # Get operational status - handle yes/no strings and boolean values
                is_installed = True
                if is_installed_col in df.columns and pd.notna(row.get(is_installed_col)):
                    val = row[is_installed_col]
                    if isinstance(val, bool):
                        is_installed = val
                    else:
                        is_installed = str(val).upper() in ['OUI', 'YES', 'TRUE', '1', 'Y']
                
                is_renting = True
                if is_renting_col in df.columns and pd.notna(row.get(is_renting_col)):
                    val = row[is_renting_col]
                    if isinstance(val, bool):
                        is_renting = val
                    else:
                        is_renting = str(val).upper() in ['OUI', 'YES', 'TRUE', '1', 'Y']
                
                is_returning = True
                if is_returning_col in df.columns and pd.notna(row.get(is_returning_col)):
                    val = row[is_returning_col]
                    if isinstance(val, bool):
                        is_returning = val
                    else:
                        is_returning = str(val).upper() in ['OUI', 'YES', 'TRUE', '1', 'Y']
                    
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid numeric data for station {station_id}: {e}")
                continue
            
            if not latitude or not longitude:
                logger.warning(f"Missing coordinates for station {station_id}")
                continue
            
            try:
                commune_code = None
                commune_id = None
                
                # Only try to get commune code if the column exists
                if commune_code_col in df.columns:
                    commune_code = str(row[commune_code_col]).strip() if pd.notna(row.get(commune_code_col)) else None
                    commune_id = communes_dict.get(commune_code) if commune_code else None
                
                station, created = BikeStation.objects.get_or_create(
                    stationcode=station_id,
                    defaults={
                        'name': name,
                        'latitude': latitude,
                        'longitude': longitude,
                        'capacity': capacity,
                        'mechanical': mechanical,
                        'ebike': electric,
                        'commune_id': commune_id,
                        'is_installed': is_installed,
                        'is_renting': is_renting,
                        'is_returning': is_returning,
                    }
                )
                
                # Update existing stations with latest data
                if not created:
                    station.name = name
                    station.latitude = latitude
                    station.longitude = longitude
                    station.capacity = capacity
                    station.mechanical = mechanical
                    station.ebike = electric
                    station.is_installed = is_installed
                    station.is_renting = is_renting
                    station.is_returning = is_returning
                    station.save()
                
                stations_dict[station_id] = station.id
                
                if created:
                    logger.info(f"Created station: {station_id} - {name}")
                    
            except Exception as e:
                logger.error(f"Error loading station {station_id}: {e}")
        
        logger.info(f"Loaded {len(stations_dict)} stations")
        return stations_dict


class StationStatusLoader:
    """Load station status (real-time snapshot) data into database"""
    
    @staticmethod
    @transaction.atomic
    def load_statuses(df: pd.DataFrame, stations_dict: Dict[str, int],
                     station_id_col: str = 'stationcode',
                     bikes_col: str = 'numbikesavailable',
                     docks_col: str = 'numdocksavailable',
                     timestamp_col: str = 'duedate',
                     mechanical_col: str = 'mechanical',
                     electric_col: str = 'ebike',
                     is_installed_col: str = 'is_installed',
                     is_renting_col: str = 'is_renting',
                     is_returning_col: str = 'is_returning',
                     batch_size: int = 1000) -> int:
        """
        Load station status records into database
        
        Args:
            df: DataFrame with status data
            stations_dict: Dictionary mapping station IDs to model IDs
            station_id_col: Column name for station ID
            bikes_col: Column name for available bikes
            docks_col: Column name for available docks
            timestamp_col: Column name for timestamp
            mechanical_col: Column name for available mechanical bikes
            electric_col: Column name for available electric bikes
            is_installed_col: Column name for installation status
            is_renting_col: Column name for renting status
            is_returning_col: Column name for returning status
            batch_size: Batch size for bulk_create
            
        Returns:
            Number of records loaded
        """
        status_records = []
        count = 0
        
        for _, row in df.iterrows():
            station_id = str(row[station_id_col]).strip()
            
            # Skip if station not found
            if station_id not in stations_dict:
                logger.debug(f"Station {station_id} not found in stations_dict")
                continue
            
            try:
                numbikesavailable = int(row[bikes_col]) if pd.notna(row[bikes_col]) else 0
                numdocksavailable = int(row[docks_col]) if pd.notna(row[docks_col]) else 0
                mechanical = int(row[mechanical_col]) if mechanical_col in df.columns and pd.notna(row.get(mechanical_col)) else 0
                ebike = int(row[electric_col]) if electric_col in df.columns and pd.notna(row.get(electric_col)) else 0
                
                # Parse timestamp - keep it simple
                if pd.notna(row[timestamp_col]):
                    try:
                        ts_str = str(row[timestamp_col])
                        # Remove timezone info if present
                        if '+' in ts_str:
                            ts_str = ts_str.split('+')[0]
                        elif ts_str.endswith('Z'):
                            ts_str = ts_str[:-1]
                        
                        timestamp = timezone.datetime.strptime(ts_str, '%Y-%m-%d %H:%M:%S')
                        timestamp = timezone.make_aware(timestamp, timezone=timezone.utc)
                    except Exception as ts_err:
                        logger.debug(f"Could not parse timestamp {row[timestamp_col]}: {ts_err}")
                        timestamp = timezone.now()
                else:
                    timestamp = timezone.now()
                
                # Get operational status - handle yes/no strings
                is_installed = True
                if is_installed_col in df.columns and pd.notna(row.get(is_installed_col)):
                    val = str(row[is_installed_col]).upper()
                    is_installed = val in ['OUI', 'YES', 'TRUE', '1', 'Y']
                
                is_renting = True
                if is_renting_col in df.columns and pd.notna(row.get(is_renting_col)):
                    val = str(row[is_renting_col]).upper()
                    is_renting = val in ['OUI', 'YES', 'TRUE', '1', 'Y']
                
                is_returning = True
                if is_returning_col in df.columns and pd.notna(row.get(is_returning_col)):
                    val = str(row[is_returning_col]).upper()
                    is_returning = val in ['OUI', 'YES', 'TRUE', '1', 'Y']
                
                status = StationStatus(
                    station_id=stations_dict[station_id],
                    available_bikes=numbikesavailable,
                    available_docks=numdocksavailable,
                    timestamp=timestamp,
                    is_operational=is_installed and is_renting and is_returning
                )
                status_records.append(status)
                count += 1
                
                # Batch insert
                if len(status_records) >= batch_size:
                    StationStatus.objects.bulk_create(status_records, ignore_conflicts=True)
                    logger.info(f"Inserted {len(status_records)} status records")
                    status_records = []
                    
            except Exception as e:
                logger.error(f"Error processing status for station {station_id}: {e}")
        
        # Insert remaining records
        if status_records:
            StationStatus.objects.bulk_create(status_records, ignore_conflicts=True)
            logger.info(f"Inserted {len(status_records)} status records")
        
        logger.info(f"Total station status records loaded: {count}")
        return count


class DailyAnalyticsLoader:
    """Load daily aggregated analytics into database"""
    
    @staticmethod
    @transaction.atomic
    def load_daily_analytics(df: pd.DataFrame, communes_dict: Dict[str, int],
                            stations_dict: Dict[str, int],
                            date_col: str = 'date',
                            station_id_col: str = 'station_id',
                            commune_code_col: str = 'commune_code',
                            utilization_col: str = 'avg_utilization',
                            batch_size: int = 1000) -> int:
        """
        Load daily analytics into database
        
        Args:
            df: DataFrame with daily aggregated data
            communes_dict: Dictionary mapping commune codes to IDs
            stations_dict: Dictionary mapping station IDs to model IDs
            date_col: Column name for date
            station_id_col: Column name for station ID
            commune_code_col: Column name for commune code (optional if not in aggregated data)
            utilization_col: Column name for utilization rate
            batch_size: Batch size for bulk_create
            
        Returns:
            Number of records loaded
        """
        analytics_records = []
        count = 0
        
        # Check if commune_code column exists (it typically won't in aggregated data)
        has_commune_col = commune_code_col in df.columns
        has_utilization_col = utilization_col in df.columns
        
        for _, row in df.iterrows():
            try:
                date_val = pd.to_datetime(row[date_col]).date() if pd.notna(row[date_col]) else None
                if not date_val:
                    continue
                
                station_id = str(row[station_id_col]).strip() if pd.notna(row[station_id_col]) else None
                
                station_pk = stations_dict.get(station_id) if station_id else None
                commune_pk = None
                
                # Try to get commune code if available in data
                if has_commune_col:
                    commune_code = str(row[commune_code_col]).strip() if pd.notna(row[commune_code_col]) else None
                    commune_pk = communes_dict.get(commune_code) if commune_code else None
                
                # Must have at least station
                if not station_pk:
                    continue
                
                avg_util = float(row[utilization_col]) if has_utilization_col and pd.notna(row[utilization_col]) else 0
                
                analytics = DailyAnalytics(
                    date=date_val,
                    station_id=station_pk,
                    commune_id=commune_pk,
                    average_utilization=Decimal(str(avg_util)),
                    # Signal analysis fields
                    average_hourly_delta=Decimal('0'),
                    shannon_entropy=Decimal('0'),
                    net_flux=Decimal('0'),
                )
                analytics_records.append(analytics)
                count += 1
                
                # Batch insert
                if len(analytics_records) >= batch_size:
                    DailyAnalytics.objects.bulk_create(analytics_records, ignore_conflicts=True)
                    logger.info(f"Inserted {len(analytics_records)} daily analytics records")
                    analytics_records = []
                    
            except Exception as e:
                logger.error(f"Error processing daily analytics for date {row.get(date_col)}: {e}")
        
        # Insert remaining records
        if analytics_records:
            DailyAnalytics.objects.bulk_create(analytics_records, ignore_conflicts=True)
            logger.info(f"Inserted {len(analytics_records)} daily analytics records")
        
        logger.info(f"Total daily analytics records loaded: {count}")
        return count


class WeeklyAnalyticsLoader:
    """Load weekly aggregated analytics into database"""
    
    @staticmethod
    @transaction.atomic
    def load_weekly_analytics(df: pd.DataFrame, communes_dict: Dict[str, int],
                             stations_dict: Dict[str, int],
                             week_start_col: str = 'week_start_date',
                             station_id_col: str = 'station_id',
                             commune_code_col: str = 'commune_code',
                             utilization_col: str = 'avg_utilization',
                             batch_size: int = 1000) -> int:
        """
        Load weekly analytics into database
        
        Args:
            df: DataFrame with weekly aggregated data
            communes_dict: Dictionary mapping commune codes to IDs
            stations_dict: Dictionary mapping station IDs to model IDs
            week_start_col: Column name for week start date
            station_id_col: Column name for station ID
            commune_code_col: Column name for commune code (optional if not in aggregated data)
            utilization_col: Column name for utilization rate
            batch_size: Batch size for bulk_create
            
        Returns:
            Number of records loaded
        """
        analytics_records = []
        count = 0
        
        # Check if commune_code column exists (it typically won't in aggregated data)
        has_commune_col = commune_code_col in df.columns
        has_utilization_col = utilization_col in df.columns
        
        for _, row in df.iterrows():
            try:
                week_start = pd.to_datetime(row[week_start_col]).date() if pd.notna(row[week_start_col]) else None
                if not week_start:
                    continue
                
                # Calculate week end (6 days after start)
                from datetime import timedelta
                week_end = week_start + timedelta(days=6)
                
                station_id = str(row[station_id_col]).strip() if pd.notna(row[station_id_col]) else None
                
                station_pk = stations_dict.get(station_id) if station_id else None
                commune_pk = None
                
                # Try to get commune code if available in data
                if has_commune_col:
                    commune_code = str(row[commune_code_col]).strip() if pd.notna(row[commune_code_col]) else None
                    commune_pk = communes_dict.get(commune_code) if commune_code else None
                
                # Must have at least station
                if not station_pk:
                    continue
                
                avg_util = float(row[utilization_col]) if has_utilization_col and pd.notna(row[utilization_col]) else 0
                
                analytics = WeeklyAnalytics(
                    week_start_date=week_start,
                    week_end_date=week_end,
                    station_id=station_pk,
                    commune_id=commune_pk,
                    average_utilization=Decimal(str(avg_util)),
                    # Signal analysis fields
                    average_hourly_delta=Decimal('0'),
                    shannon_entropy=Decimal('0'),
                    net_flux=Decimal('0'),
                )
                analytics_records.append(analytics)
                count += 1
                
                # Batch insert
                if len(analytics_records) >= batch_size:
                    WeeklyAnalytics.objects.bulk_create(analytics_records, ignore_conflicts=True)
                    logger.info(f"Inserted {len(analytics_records)} weekly analytics records")
                    analytics_records = []
                    
            except Exception as e:
                logger.error(f"Error processing weekly analytics for week {row.get(week_start_col)}: {e}")
        
        # Insert remaining records
        if analytics_records:
            WeeklyAnalytics.objects.bulk_create(analytics_records, ignore_conflicts=True)
            logger.info(f"Inserted {len(analytics_records)} weekly analytics records")
        
        logger.info(f"Total weekly analytics records loaded: {count}")
        return count


class DataLoader:
    """
    Main loader class coordinating all loading operations
    """
    
    def __init__(self):
        self.commune_loader = CommuneLoader()
        self.station_loader = BikeStationLoader()
        self.status_loader = StationStatusLoader()
        self.daily_loader = DailyAnalyticsLoader()
        self.weekly_loader = WeeklyAnalyticsLoader()
    
    @transaction.atomic
    def load(self, transformed_data: Dict[str, pd.DataFrame]) -> Dict[str, int]:
        """
        Load all transformed data into database
        
        Args:
            transformed_data: Dictionary with raw, daily, weekly DataFrames
            
        Returns:
            Dictionary with counts of loaded records
        """
        logger.info("Starting data loading pipeline")
        
        result = {
            'communes': 0,
            'stations': 0,
            'statuses': 0,
            'daily_analytics': 0,
            'weekly_analytics': 0,
            'errors': []
        }
        
        if not transformed_data or 'raw' not in transformed_data:
            logger.error("No raw data to load")
            return result
        
        df_raw = transformed_data['raw']
        
        try:
            # Load communes
            communes_dict = self.commune_loader.load_communes(
                df_raw, 
                code_col='code_insee_commune',
                name_col='nom_arrondissement_communes'
            )
            result['communes'] = len(communes_dict)
            
            # Load stations
            stations_dict = self.station_loader.load_stations(df_raw, communes_dict)
            result['stations'] = len(stations_dict)
            
            # Load station statuses
            result['statuses'] = self.status_loader.load_statuses(df_raw, stations_dict)
            
            # Load daily analytics
            if 'daily' in transformed_data:
                result['daily_analytics'] = self.daily_loader.load_daily_analytics(
                    transformed_data['daily'], 
                    communes_dict, 
                    stations_dict,
                    station_id_col='stationcode',
                    commune_code_col='code_insee_commune'  # May not exist in aggregated data
                )
            
            # Load weekly analytics
            if 'weekly' in transformed_data:
                result['weekly_analytics'] = self.weekly_loader.load_weekly_analytics(
                    transformed_data['weekly'], 
                    communes_dict, 
                    stations_dict,
                    station_id_col='stationcode',
                    commune_code_col='code_insee_commune'  # May not exist in aggregated data
                )
            
            logger.info(f"Data loading completed successfully: {result}")
            
        except Exception as e:
            logger.error(f"Error during data loading: {e}")
            result['errors'].append(str(e))
        
        return result
