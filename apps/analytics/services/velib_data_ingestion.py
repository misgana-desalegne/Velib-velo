"""
Data ingestion service for fetching Vélib availability data from Paris Open Data API.

API: https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/
"""

import requests
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from django.utils import timezone
import logging

from apps.analytics.models import Commune, BikeStation, StationStatus

logger = logging.getLogger(__name__)


class VelibDataIngestionService:
    """Service for fetching and processing Vélib data from Paris Open Data API"""
    
    # API endpoint for real-time Vélib data
    API_BASE_URL = "https://opendata.paris.fr/api/records/1.0/search"
    DATASET_ID = "velib-disponibilite-en-temps-reel"
    
    # Batch size for API requests
    RECORDS_PER_REQUEST = 100
    
    @staticmethod
    def fetch_all_stations(limit: Optional[int] = None) -> List[Dict]:
        """
        Fetch all stations from the Paris Open Data API.
        
        Returns list of station records with real-time availability data.
        """
        all_records = []
        offset = 0
        max_records = limit if limit else float('inf')
        
        logger.info(f"Starting data fetch from {VelibDataIngestionService.API_BASE_URL}")
        
        while len(all_records) < max_records:
            try:
                params = {
                    'dataset': VelibDataIngestionService.DATASET_ID,
                    'rows': VelibDataIngestionService.RECORDS_PER_REQUEST,
                    'start': offset,
                    'format': 'json'
                }
                
                response = requests.get(
                    VelibDataIngestionService.API_BASE_URL,
                    params=params,
                    timeout=30
                )
                response.raise_for_status()
                
                data = response.json()
                records = data.get('records', [])
                
                if not records:
                    break
                
                all_records.extend(records)
                logger.info(f"Fetched {len(all_records)} records...")
                
                offset += VelibDataIngestionService.RECORDS_PER_REQUEST
                
                # Check if we've reached the total count
                total_count = data.get('nhits', 0)
                if len(all_records) >= total_count:
                    break
                    
            except Exception as e:
                logger.error(f"Error fetching data: {str(e)}")
                break
        
        logger.info(f"✓ Fetched {len(all_records)} total station records")
        return all_records
    
    @staticmethod
    def parse_station_record(record: Dict) -> Dict:
        """
        Parse a raw station record from the API into our model structure.
        
        API fields: name, stationcode, ebike, mechanical, numbikesavailable, 
                   numdocksavailable, capacity, is_installed, is_renting, 
                   is_returning, nom_arrondissement_communes, coordonnees_geo
        """
        fields = record.get('fields', {})
        geometry = record.get('geometry', {})
        coordinates = geometry.get('coordinates', [0, 0])  # [lon, lat]
        
        total_bikes = int(fields.get('numbikesavailable', 0))
        available_ebikes = int(fields.get('ebike', 0))
        available_mechanical = int(fields.get('mechanical', 0))
        
        return {
            'station_id': str(fields.get('stationcode', '')),
            'name': fields.get('name', ''),
            'commune_code': VelibDataIngestionService.extract_commune_code(
                fields.get('code_insee_commune', '')
            ),
            'commune_name': fields.get('nom_arrondissement_communes', ''),
            'latitude': Decimal(str(coordinates[1])) if len(coordinates) > 1 else Decimal('0'),
            'longitude': Decimal(str(coordinates[0])) if len(coordinates) > 0 else Decimal('0'),
            'total_docks': int(fields.get('capacity', 0)),
            'available_bikes': total_bikes,
            'available_ebikes': available_ebikes,
            'available_mechanical': available_mechanical,
            'is_installed': fields.get('is_installed', '').upper() == 'OUI',
            'is_renting': fields.get('is_renting', '').upper() == 'OUI',
            'is_returning': fields.get('is_returning', '').upper() == 'OUI',
            'timestamp': timezone.now(),
        }
    
    @staticmethod
    def extract_commune_code(code_insee: str) -> str:
        """
        Extract commune INSEE code.
        
        Example: "75101" -> "75101" (5-digit INSEE code for Paris 1st)
        The INSEE code fully identifies the commune.
        """
        if not code_insee:
            return '75056'  # Default to Paris
        
        try:
            # INSEE format: SSCCC = State-SubDivision-Commune (5 digits)
            if len(code_insee) >= 5:
                return code_insee[:5]
        except (ValueError, IndexError):
            pass
        
        return '75056'
    
    @staticmethod
    def sync_stations_and_status(records: List[Dict]) -> Dict:
        """
        Sync fetched records to database.
        
        Creates/updates BikeStation records and creates StationStatus snapshots.
        Returns summary of operations.
        """
        created_stations = 0
        updated_stations = 0
        created_statuses = 0
        skipped = 0
        errors = 0
        
        for record in records:
            try:
                parsed = VelibDataIngestionService.parse_station_record(record)
                
                if not parsed['station_id'] or not parsed['commune_code']:
                    skipped += 1
                    continue
                
                # Get or create commune
                commune, _ = Commune.objects.get_or_create(
                    code=parsed['commune_code'],
                    defaults={'name': parsed.get('commune_name', f"Commune {parsed['commune_code']}"), 'population': 0}
                )
                
                # Get or create bike station
                station, created = BikeStation.objects.get_or_create(
                    station_id=parsed['station_id'],
                    defaults={
                        'name': parsed['name'],
                        'commune': commune,
                        'latitude': parsed['latitude'],
                        'longitude': parsed['longitude'],
                        'total_docks': parsed['total_docks'],
                        'is_active': parsed['is_installed'] and parsed['is_renting'],
                    }
                )
                
                if created:
                    created_stations += 1
                else:
                    # Update existing station
                    station.name = parsed['name']
                    station.latitude = parsed['latitude']
                    station.longitude = parsed['longitude']
                    station.total_docks = parsed['total_docks']
                    station.is_active = parsed['is_installed'] and parsed['is_renting']
                    station.save()
                    updated_stations += 1
                
                # Create status record
                available_docks = parsed['total_docks'] - parsed['available_bikes']
                
                status = StationStatus.objects.create(
                    station=station,
                    timestamp=parsed['timestamp'],
                    available_bikes=parsed['available_bikes'],
                    available_docks=max(0, available_docks),
                    is_operational=parsed['is_installed'] and (parsed['is_renting'] or parsed['is_returning'])
                )
                created_statuses += 1
                
            except Exception as e:
                logger.error(f"Error processing station record: {str(e)}")
                errors += 1
                continue
        
        return {
            'stations_created': created_stations,
            'stations_updated': updated_stations,
            'statuses_created': created_statuses,
            'records_skipped': skipped,
            'errors': errors,
            'total_processed': len(records),
        }
    
    @staticmethod
    def fetch_and_sync(limit: Optional[int] = None) -> Dict:
        """
        Complete pipeline: fetch data and sync to database.
        
        Returns summary of operations.
        """
        logger.info("=" * 60)
        logger.info("Starting Vélib data ingestion...")
        logger.info("=" * 60)
        
        # Fetch data from API
        records = VelibDataIngestionService.fetch_all_stations(limit)
        
        if not records:
            logger.error("No records fetched from API")
            return {'error': 'No data fetched'}
        
        # Sync to database
        summary = VelibDataIngestionService.sync_stations_and_status(records)
        
        logger.info("=" * 60)
        logger.info("Ingestion complete!")
        logger.info(f"Stations created: {summary['stations_created']}")
        logger.info(f"Stations updated: {summary['stations_updated']}")
        logger.info(f"Status records: {summary['statuses_created']}")
        logger.info(f"Errors: {summary['errors']}")
        logger.info("=" * 60)
        
        return summary
