import placesData from '../data/places.json';

export interface Place {
  id: string;
  nameEn: string;
  nameTa: string;
  lat: number;
  lng: number;
}

export const places: Place[] = (placesData as any[]).filter((p) => p.id && p.lat && p.lng);

const placeIndexMap = new Map<string, number>();
places.forEach((p, index) => {
  placeIndexMap.set(p.id, index);
});

let binaryMatrix: Uint16Array | null = null;
let loadingPromise: Promise<Uint16Array | null> | null = null;

/**
 * Lazily loads /distances.bin (uint16 matrix in units of 10m)
 */
export async function loadPrecomputedMatrix(): Promise<Uint16Array | null> {
  if (binaryMatrix) {
    return binaryMatrix;
  }
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const response = await fetch('/distances.bin');
      if (!response.ok) {
        console.warn('distances.bin not found or failed to load, falling back to calculation');
        return null;
      }
      const buffer = await response.arrayBuffer();
      binaryMatrix = new Uint16Array(buffer);
      return binaryMatrix;
    } catch (e) {
      console.warn('Could not load precomputed distances matrix:', e);
      return null;
    }
  })();

  return loadingPromise;
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Returns road distance in km between two place IDs.
 * Uses uint16 matrix (in units of 10 metres) if available,
 * otherwise falls back to calibrated straight-line road estimate (x 1.3).
 */
export async function getPrecomputedDistanceKm(originId: string, destId: string): Promise<number | null> {
  const i = placeIndexMap.get(originId);
  const j = placeIndexMap.get(destId);

  if (i === undefined || j === undefined) {
    return null;
  }
  if (i === j) {
    return 0;
  }

  const matrix = await loadPrecomputedMatrix();
  const n = places.length;

  if (matrix && matrix.length >= n * n) {
    const rawVal = matrix[i * n + j];
    if (rawVal > 0) {
      // rawVal is in 10-meter units
      const distanceMeters = rawVal * 10;
      return Math.round((distanceMeters / 1000) * 100) / 100;
    }
  }

  // Fallback: Haversine * 1.3
  const p1 = places[i];
  const p2 = places[j];
  const directKm = haversineDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
  return Math.round(directKm * 1.3 * 100) / 100;
}
