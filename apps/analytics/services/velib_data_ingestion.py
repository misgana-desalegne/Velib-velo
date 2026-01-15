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
            'stationcode': str(fields.get('stationcode', '')),
            'name': fields.get('name', ''),
            'code_insee_commune': VelibDataIngestionService.extract_commune_code(
                fields.get('code_insee_commune', '')
            ),
            'nom_arrondissement_communes': fields.get('nom_arrondissement_communes', ''),
            'latitude': float(coordinates[1]) if len(coordinates) > 1 else 0.0,
            'longitude': float(coordinates[0]) if len(coordinates) > 0 else 0.0,
            'capacity': int(fields.get('capacity', 0)),
            'numbikesavailable': total_bikes,
            'ebike': available_ebikes,
            'mechanical': available_mechanical,
            'is_installed': fields.get('is_installed', '').upper() == 'OUI',
            'is_renting': fields.get('is_renting', '').upper() == 'OUI',
            'is_returning': fields.get('is_returning', '').upper() == 'OUI',
            'duedate': timezone.now(),
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
                
                if not parsed['stationcode'] or not parsed['code_insee_commune']:
                    skipped += 1
                    continue
                
                # Get or create commune
                commune, _ = Commune.objects.get_or_create(
                    code=parsed['code_insee_commune'],
                    defaults={'name': parsed.get('nom_arrondissement_communes', f"Commune {parsed['code_insee_commune']}"), 'population': 0}
                )
                
                # Get or create bike station
                station, created = BikeStation.objects.get_or_create(
                    stationcode=parsed['stationcode'],
                    defaults={
                        'name': parsed['name'],
                        'commune': commune,
                        'latitude': parsed['latitude'],
                        'longitude': parsed['longitude'],
                        'capacity': parsed['capacity'],
                        'is_installed': parsed['is_installed'] and parsed['is_renting'],
                        'numbikesavailable': parsed['numbikesavailable'],
                        'numdocksavailable': max(0, parsed['capacity'] - parsed['numbikesavailable']),
                        'mechanical': parsed['mechanical'],
                        'ebike': parsed['ebike'],
                        'is_renting': parsed['is_renting'],
                        'is_returning': parsed['is_returning'],
                    }
                )
                
                if created:
                    created_stations += 1
                else:
                    # Update existing station
                    station.name = parsed['name']
                    station.latitude = parsed['latitude']
                    station.longitude = parsed['longitude']
                    station.capacity = parsed['capacity']
                    station.is_installed = parsed['is_installed'] and parsed['is_renting']
                    station.numbikesavailable = parsed['numbikesavailable']
                    station.numdocksavailable = max(0, parsed['capacity'] - parsed['numbikesavailable'])
                    station.mechanical = parsed['mechanical']
                    station.ebike = parsed['ebike']
                    station.is_renting = parsed['is_renting']
                    station.is_returning = parsed['is_returning']
                    station.save()
                    updated_stations += 1
                
                # Create status record
                status = StationStatus.objects.create(
                    station=station,
                    timestamp=parsed['duedate'],
                    available_bikes=parsed['numbikesavailable'],
                    available_docks=max(0, parsed['capacity'] - parsed['numbikesavailable']),
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
