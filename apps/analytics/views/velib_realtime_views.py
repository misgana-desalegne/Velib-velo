"""Velib real-time endpoints.

Thin DRF views that proxy/aggregate opendata.paris.fr real-time availability.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..services.velib_realtime_service import VelibRealtimeFetchError, VelibRealtimeService


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


@api_view(["GET"])
def velib_realtime(request):
    """Return Velib real-time availability aggregates.

    GET /api/velib/realtime/?include_stations=true
    """

    include_stations = _parse_bool(request.query_params.get("include_stations"), default=False)
    only_installed = _parse_bool(request.query_params.get("only_installed"), default=True)
    only_renting = _parse_bool(request.query_params.get("only_renting"), default=False)

    try:
        data = VelibRealtimeService.get_realtime_stats(
            include_stations=include_stations,
            only_installed=only_installed,
            only_renting=only_renting,
        )
        return Response(data)
    except VelibRealtimeFetchError as exc:
        return Response({"error": "Upstream data fetch failed", "details": str(exc)}, status=502)
