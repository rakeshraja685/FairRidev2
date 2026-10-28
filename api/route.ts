/**
 * Serverless Route Handler (Vercel / Netlify compatible)
 * POST /api/route
 * Body: { origin: [lat, lng], destination: [lat, lng] } or { originLat, originLng, destLat, destLng }
 */

interface CacheEntry {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // [lng, lat]
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

// Rate limiting state
let minuteWindowStart = Date.now();
let requestsThisMinute = 0;

let dayWindowDate = new Date().toISOString().slice(0, 10);
let requestsToday = 0;

const MAX_PER_MINUTE = 40;
const MAX_PER_DAY = 1900;

export default async function handler(req: any, res: any) {
  // CORS headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : null;
  }

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  // Reset minute rate limiter
  if (now - minuteWindowStart > 60000) {
    minuteWindowStart = now;
    requestsThisMinute = 0;
  }

  // Reset daily counter
  if (today !== dayWindowDate) {
    dayWindowDate = today;
    requestsToday = 0;
  }

  if (requestsThisMinute >= MAX_PER_MINUTE || requestsToday >= MAX_PER_DAY) {
    return res.status(429).json({
      fallback: true,
      error: 'Rate limit reached (40/min or 1,900/day cap)',
      requestsToday,
      requestsThisMinute
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const originLat = parseFloat(body.originLat ?? body.origin?.[0]);
    const originLng = parseFloat(body.originLng ?? body.origin?.[1]);
    const destLat = parseFloat(body.destLat ?? body.destination?.[0]);
    const destLng = parseFloat(body.destLng ?? body.destination?.[1]);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({ error: 'Missing or invalid origin/destination coordinates' });
    }

    // Coordinates rounded to 3 decimals
    const oLat3 = originLat.toFixed(3);
    const oLng3 = originLng.toFixed(3);
    const dLat3 = destLat.toFixed(3);
    const dLng3 = destLng.toFixed(3);

    const cacheKey = `${oLat3},${oLng3}->${dLat3},${dLng3}`;
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      return res.status(200).json({
        cached: true,
        distanceMeters: cached.distanceMeters,
        durationSeconds: cached.durationSeconds,
        coordinates: cached.coordinates
      });
    }

    requestsThisMinute++;
    requestsToday++;

    const routingBaseUrl = process.env.ROUTING_BASE_URL;
    const orsApiKey = process.env.ORS_API_KEY;

    // 1. If custom OSRM server configured
    if (routingBaseUrl) {
      const osrmUrl = `${routingBaseUrl}/route/v1/driving/${oLng3},${oLat3};${dLng3},${dLat3}?overview=full&geometries=geojson`;
      const osrmResp = await fetch(osrmUrl);
      if (osrmResp.ok) {
        const osrmData = await osrmResp.json();
        const primaryRoute = osrmData.routes?.[0];
        if (primaryRoute) {
          const result = {
            distanceMeters: primaryRoute.distance,
            durationSeconds: primaryRoute.duration,
            coordinates: primaryRoute.geometry?.coordinates || []
          };
          memoryCache.set(cacheKey, { ...result, timestamp: now });
          return res.status(200).json(result);
        }
      }
    }

    // 2. OpenRouteService Directions API
    if (orsApiKey) {
      const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
      const orsResp = await fetch(orsUrl, {
        method: 'POST',
        headers: {
          'Authorization': orsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [
            [parseFloat(oLng3), parseFloat(oLat3)],
            [parseFloat(dLng3), parseFloat(dLat3)]
          ]
        })
      });

      if (orsResp.ok) {
        const orsData = await orsResp.json();
        const feature = orsData.features?.[0];
        const summary = feature?.properties?.summary;
        const coords = feature?.geometry?.coordinates || [];

        if (summary) {
          const result = {
            distanceMeters: summary.distance,
            durationSeconds: summary.duration,
            coordinates: coords
          };
          memoryCache.set(cacheKey, { ...result, timestamp: now });
          return res.status(200).json(result);
        }
      }
    }

    // 3. Fallback straight-line distance * 1.3
    const dLat = ((destLat - originLat) * Math.PI) / 180;
    const dLon = ((destLng - originLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightMeters = 6371000 * c;
    const roadMeters = Math.round(straightMeters * 1.3);

    return res.status(200).json({
      fallback: true,
      approximate: true,
      distanceMeters: roadMeters,
      durationSeconds: Math.round((roadMeters / 1000 / 25) * 3600), // ~25km/h avg auto speed
      coordinates: [
        [originLng, originLat],
        [destLng, destLat]
      ]
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Routing error', fallback: true });
  }
}
