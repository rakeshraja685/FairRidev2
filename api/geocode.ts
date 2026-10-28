/**
 * Serverless Geocode Proxy
 * GET /api/geocode?q=Chennai%20Central
 */

export default async function handler(req: any, res: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : null;
  }

  const query = req.query?.q || (req.url ? new URL(req.url, 'http://localhost').searchParams.get('q') : '');
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing search query parameter q' });
  }

  const orsKey = process.env.ORS_API_KEY;

  try {
    // If OpenRouteService key is provided
    if (orsKey) {
      const url = `https://api.openrouteservice.org/geocode/search?api_key=${orsKey}&text=${encodeURIComponent(query)}&boundary.country=IND&focus.point.lat=13.0827&focus.point.lon=80.2757`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const features = data.features || [];
        const results = features.map((f: any) => ({
          label: f.properties?.label || f.properties?.name,
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0]
        }));
        return res.status(200).json({ results });
      }
    }

    // Free OpenStreetMap Nominatim proxy with attribution & user-agent
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Chennai, Tamil Nadu')}&format=json&limit=5&countrycodes=in`;
    const nomResp = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'FairRide-App/1.0 (https://fairride.tn)'
      }
    });

    if (nomResp.ok) {
      const nomData = await nomResp.json();
      const results = (nomData || []).map((item: any) => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
      return res.status(200).json({ results });
    }

    return res.status(200).json({ results: [] });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Geocoding lookup failed' });
  }
}
