"""\
Velib real-time availability service.

Fetches data from opendata.paris.fr (dataset: velib-disponibilite-en-temps-reel)
and provides lightweight aggregates for the dashboard.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

import urllib.parse


_DATASET_URL = (
    "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/"
    "velib-disponibilite-en-temps-reel/records"
)


class VelibRealtimeFetchError(RuntimeError):
    pass


@dataclass
class _CacheEntry:
    expires_at: datetime
    value: Dict[str, Any]


_cache_entry: Optional[_CacheEntry] = None


class VelibRealtimeService:
    """Service for fetching and aggregating real-time Velib availability."""

    @staticmethod
    def get_realtime_stats(
        *,
        include_stations: bool = False,
        only_installed: bool = True,
        only_renting: bool = False,
        cache_seconds: int = 30,
    ) -> Dict[str, Any]:
        """Return aggregated stats (and optionally station list) from the live dataset."""

        global _cache_entry
        now = datetime.now(timezone.utc)
        if _cache_entry and _cache_entry.expires_at > now:
            cached = _cache_entry.value
            if include_stations and "stations" not in cached:
                # Cache might be aggregated-only; refetch for stations.
                pass
            else:
                return cached

        try:
            # Fast path: use ODSQL aggregates so we don't download all station rows.
            if not include_stations:
                payload = VelibRealtimeService._fetch_aggregates(
                    only_installed=only_installed,
                    only_renting=only_renting,
                )
            else:
                stations = VelibRealtimeService._fetch_all_stations(
                    only_installed=only_installed,
                    only_renting=only_renting,
                )
                payload = VelibRealtimeService._aggregate(stations, include_stations=True)
        except Exception as exc:  # noqa: BLE001 (surface upstream error cleanly)
            # If we have a stale cache, serve it rather than failing hard.
            if _cache_entry:
                stale = dict(_cache_entry.value)
                stale["warning"] = "Serving cached data due to upstream fetch error"
                return stale
            raise VelibRealtimeFetchError(str(exc)) from exc

        _cache_entry = _CacheEntry(expires_at=now + timedelta(seconds=cache_seconds), value=payload)
        return payload

    @staticmethod
    def _fetch_all_stations(*, only_installed: bool, only_renting: bool) -> List[Dict[str, Any]]:
        select_fields = [
            "stationcode",
            "name",
            "is_installed",
            "capacity",
            "numdocksavailable",
            "numbikesavailable",
            "mechanical",
            "ebike",
            "is_renting",
            "is_returning",
            "duedate",
            "coordonnees_geo",
            "nom_arrondissement_communes",
        ]

        where_parts: List[str] = []
        if only_installed:
            where_parts.append("is_installed='OUI'")
        if only_renting:
            where_parts.append("is_renting='OUI'")
        where = " AND ".join(where_parts) if where_parts else None

        page_size = 100
        offset = 0
        results: List[Dict[str, Any]] = []

        while True:
            params = {
                "limit": str(page_size),
                "offset": str(offset),
                "select": ",".join(select_fields),
            }
            if where:
                params["where"] = where

            url = f"{_DATASET_URL}?{urllib.parse.urlencode(params)}"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "projet-velib/0.1 (+Django)",
                    "Accept": "application/json",
                },
                method="GET",
            )

            with urllib.request.urlopen(req, timeout=20) as response:
                data = json.load(response)

            page = data.get("results") or []
            if not page:
                break

            results.extend(page)
            if len(page) < page_size:
                break
            offset += page_size

            # Safety cap: dataset is ~1500 records; avoid infinite loops.
            if offset > 5000:
                break

        return results

    @staticmethod
    def _fetch_aggregates(*, only_installed: bool, only_renting: bool) -> Dict[str, Any]:
        """Fetch totals + per-area aggregates via ODSQL (Explore API v2.1)."""

        where_parts: List[str] = []
        if only_installed:
            where_parts.append("is_installed='OUI'")
        if only_renting:
            where_parts.append("is_renting='OUI'")
        where = " AND ".join(where_parts) if where_parts else None

        totals_select = (
            "count(*) as stations,"
            "sum(capacity) as capacity,"
            "sum(numbikesavailable) as bikes_available,"
            "sum(numdocksavailable) as docks_available,"
            "sum(mechanical) as mechanical_available,"
            "sum(ebike) as ebike_available,"
            "max(duedate) as updated_at"
        )

        totals_params = {
            "select": totals_select,
            "limit": "1",
        }
        if where:
            totals_params["where"] = where

        totals_data = VelibRealtimeService._fetch_json(totals_params)
        totals_row = (totals_data.get("results") or [{}])[0]

        by_area_select = (
            "count(*) as stations,"
            "sum(capacity) as capacity,"
            "sum(numbikesavailable) as bikes_available,"
            "sum(numdocksavailable) as docks_available,"
            "sum(mechanical) as mechanical_available,"
            "sum(ebike) as ebike_available"
        )

        by_area_params = {
            "select": by_area_select,
            "group_by": "nom_arrondissement_communes as name",
            "order_by": "bikes_available desc",
            "limit": "20000",
        }
        if where:
            by_area_params["where"] = where

        by_area_data = VelibRealtimeService._fetch_json(by_area_params)
        by_area_rows = by_area_data.get("results") or []

        def as_int(value: Any) -> int:
            try:
                return int(value)
            except Exception:
                return 0

        totals = {
            "stations": as_int(totals_row.get("stations")),
            "capacity": as_int(totals_row.get("capacity")),
            "bikes_available": as_int(totals_row.get("bikes_available")),
            "docks_available": as_int(totals_row.get("docks_available")),
            "mechanical_available": as_int(totals_row.get("mechanical_available")),
            "ebike_available": as_int(totals_row.get("ebike_available")),
        }

        by_area = [
            {
                "name": (row.get("name") or "Unknown").strip() or "Unknown",
                "stations": as_int(row.get("stations")),
                "capacity": as_int(row.get("capacity")),
                "bikes_available": as_int(row.get("bikes_available")),
                "docks_available": as_int(row.get("docks_available")),
                "mechanical_available": as_int(row.get("mechanical_available")),
                "ebike_available": as_int(row.get("ebike_available")),
            }
            for row in by_area_rows
        ]

        return {
            "source": "opendata.paris.fr/velib-disponibilite-en-temps-reel",
            "updated_at": totals_row.get("updated_at"),
            "totals": totals,
            "by_area": by_area,
        }

    @staticmethod
    def _fetch_json(params: Dict[str, str]) -> Dict[str, Any]:
        url = f"{_DATASET_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "projet-velib/0.1 (+Django)",
                "Accept": "application/json",
            },
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.load(response)

    @staticmethod
    def _aggregate(stations: List[Dict[str, Any]], *, include_stations: bool) -> Dict[str, Any]:
        totals = {
            "stations": len(stations),
            "capacity": 0,
            "bikes_available": 0,
            "docks_available": 0,
            "mechanical_available": 0,
            "ebike_available": 0,
        }

        by_area: Dict[str, Dict[str, Any]] = {}
        latest_due: Optional[str] = None

        for s in stations:
            capacity = int(s.get("capacity") or 0)
            bikes = int(s.get("numbikesavailable") or 0)
            docks = int(s.get("numdocksavailable") or 0)
            mechanical = int(s.get("mechanical") or 0)
            ebike = int(s.get("ebike") or 0)

            totals["capacity"] += capacity
            totals["bikes_available"] += bikes
            totals["docks_available"] += docks
            totals["mechanical_available"] += mechanical
            totals["ebike_available"] += ebike

            due = s.get("duedate")
            if isinstance(due, str) and (latest_due is None or due > latest_due):
                latest_due = due

            area = (s.get("nom_arrondissement_communes") or "Unknown").strip() or "Unknown"
            area_bucket = by_area.setdefault(
                area,
                {
                    "name": area,
                    "stations": 0,
                    "capacity": 0,
                    "bikes_available": 0,
                    "docks_available": 0,
                    "mechanical_available": 0,
                    "ebike_available": 0,
                },
            )
            area_bucket["stations"] += 1
            area_bucket["capacity"] += capacity
            area_bucket["bikes_available"] += bikes
            area_bucket["docks_available"] += docks
            area_bucket["mechanical_available"] += mechanical
            area_bucket["ebike_available"] += ebike

        response: Dict[str, Any] = {
            "source": "opendata.paris.fr/velib-disponibilite-en-temps-reel",
            "updated_at": latest_due,
            "totals": totals,
            "by_area": sorted(by_area.values(), key=lambda x: x["bikes_available"], reverse=True),
        }

        if include_stations:
            response["stations"] = stations

        return response
