import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Place {
  id: string;
  nameEn: string;
  nameTa: string;
  lat: number;
  lng: number;
}

// Haversine formula for straight line distance in km
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return R * c;
}

async function buildMatrix() {
  const placesPath = path.resolve(__dirname, '../src/data/places.json');
  const rawData = fs.readFileSync(placesPath, 'utf-8');
  const places: Place[] = JSON.parse(rawData).filter((p: Place) => p.id && p.lat && p.lng);

  const n = places.length;
  console.log(`Building distance matrix for ${n} Chennai landmarks...`);

  const osrmUrl = process.env.OSRM_URL || 'http://localhost:5000';
  let distancesMeters: number[][] = [];

  try {
    const coordsStr = places.map((p) => `${p.lng},${p.lat}`).join(';');
    const tableUrl = `${osrmUrl}/table/v1/driving/${coordsStr}?annotations=distance`;
    console.log(`Attempting to query local OSRM at ${tableUrl.slice(0, 80)}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(tableUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (data.code === 'Ok' && Array.isArray(data.distances)) {
        console.log('Successfully retrieved OSRM road distance table!');
        distancesMeters = data.distances;
      }
    }
  } catch (err) {
    console.log('Local OSRM server not reachable. Generating estimated road distance matrix (Haversine * 1.35 factor)...');
  }

  // Fallback if OSRM was not running
  if (distancesMeters.length === 0) {
    distancesMeters = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          distancesMeters[i][j] = 0;
        } else {
          const direct = haversineDistanceKm(places[i].lat, places[i].lng, places[j].lat, places[j].lng);
          // 1.32 urban road circuity factor for Chennai road grid
          const roadKm = direct * 1.32;
          distancesMeters[i][j] = Math.round(roadKm * 1000);
        }
      }
    }
  }

  // Write uint16 array (distances in 10-metre units)
  const buffer = Buffer.alloc(n * n * 2);
  let offset = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dist10m = Math.min(65535, Math.round(distancesMeters[i][j] / 10));
      buffer.writeUInt16LE(dist10m, offset);
      offset += 2;
    }
  }

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outPath = path.join(publicDir, 'distances.bin');
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${outPath} (${buffer.length} bytes) successfully!`);
}

buildMatrix().catch(console.error);
