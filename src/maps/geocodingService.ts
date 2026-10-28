/**
 * Free & Open Geocoding Service for Tamil Nadu & India
 * Uses Photon (Komoot/OSM) as ultra-fast primary with geographical bias towards Tamil Nadu,
 * and OpenStreetMap Nominatim as secondary fallback for multilingual (Tamil script) & deep rural coverage.
 * Completely free, no API keys, no billing, with client-side caching to support unlimited users.
 */

export interface GeocodeResult {
  id: string;
  name: string;
  displayName: string;
  subText: string;
  type: string; // 'village' | 'town' | 'city' | 'locality' | 'street' | 'place'
  lat: number;
  lng: number;
}

const geocodeCache = new Map<string, GeocodeResult[]>();
const MAX_CACHE_SIZE = 120;

export async function searchPlacesOnline(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // Detect Tamil script Unicode block: U+0B80 to U+0BFF
  const isTamil = /[\u0B80-\u0BFF]/.test(trimmed);
  let results: GeocodeResult[] = [];

  if (isTamil) {
    // If Tamil script is used, Nominatim indexes native Tamil names directly
    results = await fetchFromNominatim(trimmed, signal);
    if (results.length === 0) {
      results = await fetchFromPhoton(trimmed, signal);
    }
  } else {
    // English/Latin query: Photon is ultra-fast (<100ms) with full OSM village/rural coverage
    results = await fetchFromPhoton(trimmed, signal);
    if (results.length === 0) {
      results = await fetchFromNominatim(trimmed, signal);
    }
  }

  // Deduplicate results by proximity
  const seen = new Set<string>();
  const deduped: GeocodeResult[] = [];
  for (const item of results) {
    const key = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  // Cache result
  if (geocodeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = geocodeCache.keys().next().value;
    if (firstKey) geocodeCache.delete(firstKey);
  }
  geocodeCache.set(cacheKey, deduped);

  return deduped;
}

async function fetchFromPhoton(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  try {
    // Biased toward central Tamil Nadu coordinates (lat: 11.1271, lon: 78.6569)
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=11.1271&lon=78.6569&limit=8&lang=en`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.features || !Array.isArray(data.features)) return [];

    return data.features
      .filter((f: any) => {
        const country = f.properties?.countrycode || f.properties?.country;
        return !country || country === 'IN' || country.toLowerCase() === 'india';
      })
      .map((f: any, idx: number): GeocodeResult => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const name = p.name || p.street || query;

        const subParts = [
          p.district || p.county || p.city,
          p.state,
          p.postcode
        ].filter(Boolean);

        const subText = subParts
          .filter((val, i, arr) => arr.indexOf(val) === i && val.toLowerCase() !== name.toLowerCase())
          .join(', ');

        const rawType = (p.osm_value || p.type || '').toLowerCase();
        let displayType = 'place';
        if (rawType.includes('village') || rawType.includes('hamlet')) displayType = 'village';
        else if (rawType.includes('town')) displayType = 'town';
        else if (rawType.includes('city')) displayType = 'city';
        else if (rawType.includes('street') || rawType.includes('road')) displayType = 'street';
        else if (rawType.includes('suburb') || rawType.includes('neighbourhood')) displayType = 'locality';

        return {
          id: `photon-${p.osm_id || idx}`,
          name,
          displayName: subText ? `${name}, ${subText}` : name,
          subText: subText || (p.state || 'Tamil Nadu, India'),
          type: displayType,
          lat: coords[1],
          lng: coords[0]
        };
      });
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('Photon geocode fetch error:', err);
    }
    return [];
  }
}

async function fetchFromNominatim(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any): GeocodeResult => {
      const addr = item.address || {};
      const name = item.name || addr.village || addr.town || addr.city || addr.suburb || query;

      const subParts = [
        addr.village && addr.village.toLowerCase() !== name.toLowerCase() ? addr.village : null,
        addr.town && addr.town.toLowerCase() !== name.toLowerCase() ? addr.town : null,
        addr.county || addr.state_district,
        addr.state,
        addr.postcode
      ].filter(Boolean);

      const subText = subParts
        .filter((val, i, arr) => arr.indexOf(val) === i && val.toLowerCase() !== name.toLowerCase())
        .join(', ');

      const rawType = (item.type || item.class || '').toLowerCase();
      let displayType = 'place';
      if (rawType.includes('village') || rawType.includes('hamlet')) displayType = 'village';
      else if (rawType.includes('town')) displayType = 'town';
      else if (rawType.includes('city')) displayType = 'city';
      else if (rawType.includes('street') || rawType.includes('road') || rawType.includes('highway')) displayType = 'street';

      return {
        id: `nom-${item.place_id}`,
        name,
        displayName: item.display_name,
        subText: subText || item.display_name,
        type: displayType,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      };
    });
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('Nominatim geocode fetch error:', err);
    }
    return [];
  }
}
