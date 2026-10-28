import { getPrecomputedDistanceKm, haversineDistanceKm, Place } from './precomputed';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'precomputed' | 'api' | 'fallback' | 'manual';
  isApproximate: boolean;
  coordinates: [number, number][]; // [lng, lat] for MapLibre
  note?: string;
}

/**
 * Executes the exact 4-tier lookup order:
 * 1. Precomputed table when both places are landmarks
 * 2. /api/route (cached, OSRM/ORS)
 * 3. Fallback: straight-line distance x 1.3, labelled "approximate"
 * 4. Manual km box
 */
export async function resolveTripDistance({
  originPlace,
  destPlace,
  originCoords,
  destCoords
}: {
  originPlace?: Place | null;
  destPlace?: Place | null;
  originCoords?: [number, number] | null; // [lat, lng]
  destCoords?: [number, number] | null;   // [lat, lng]
}): Promise<RouteResult | null> {
  // If coordinates not supplied, get from places
  const oLat = originCoords ? originCoords[0] : originPlace?.lat;
  const oLng = originCoords ? originCoords[1] : originPlace?.lng;
  const dLat = destCoords ? destCoords[0] : destPlace?.lat;
  const dLng = destCoords ? destCoords[1] : destPlace?.lng;

  if (oLat === undefined || oLng === undefined || dLat === undefined || dLng === undefined) {
    return null;
  }

  // 1. Precomputed distance when both places are landmarks
  if (originPlace?.id && destPlace?.id) {
    const precomputedKm = await getPrecomputedDistanceKm(originPlace.id, destPlace.id);
    if (precomputedKm !== null && precomputedKm > 0) {
      return {
        distanceKm: precomputedKm,
        durationMinutes: Math.round((precomputedKm / 22) * 60), // ~22 km/h city auto speed
        source: 'precomputed',
        isApproximate: false,
        coordinates: [
          [originPlace.lng, originPlace.lat],
          [destPlace.lng, destPlace.lat]
        ],
        note: 'Precomputed Chennai road distance'
      };
    }
  }

  // 2. Live Driving Route via OSRM (Free, public, open-source routing)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
    const response = await fetch(osrmUrl, { signal: AbortSignal.timeout(4500) });

    if (response.ok) {
      const data = await response.json();
      if (data?.routes?.[0]?.distance) {
        const km = Math.round((data.routes[0].distance / 1000) * 100) / 100;
        const durMin = Math.round((data.routes[0].duration || 0) / 60);
        const coords = data.routes[0].geometry?.coordinates || [
          [oLng, oLat],
          [dLng, dLat]
        ];
        return {
          distanceKm: km,
          durationMinutes: durMin,
          source: 'api',
          isApproximate: false,
          coordinates: coords,
          note: 'Live road routing'
        };
      }
    }
  } catch (err) {
    console.warn('Live OSRM routing failed or timed out, using fallback', err);
  }

  // 3. Fallback: straight-line distance x 1.3
  const directKm = haversineDistanceKm(oLat, oLng, dLat, dLng);
  const approxKm = Math.round(directKm * 1.3 * 100) / 100;

  return {
    distanceKm: approxKm,
    durationMinutes: Math.round((approxKm / 22) * 60),
    source: 'fallback',
    isApproximate: true,
    coordinates: [
      [oLng, oLat],
      [dLng, dLat]
    ],
    note: 'Approximate distance (straight-line × 1.3)'
  };
}
