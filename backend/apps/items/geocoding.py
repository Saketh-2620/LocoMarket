import requests
from django.core.cache import cache


def geocode_address(address: str) -> dict | None:
    cache_key = f"geocode:{address.strip().lower()}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": "LocoMarket/1.0"},
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json()
        if not results:
            return None
        result = {
            "lat": float(results[0]["lat"]),
            "lng": float(results[0]["lon"]),
            "display_name": results[0].get("display_name", address),
        }
        cache.set(cache_key, result, 60 * 60 * 24)
        return result
    except requests.RequestException:
        return None
