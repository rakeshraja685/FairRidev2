import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface RouteMapProps {
  originCoords: [number, number] | null; // [lat, lng]
  destCoords: [number, number] | null;   // [lat, lng]
  routeCoordinates?: [number, number][]; // [[lng, lat], ...]
  onMapClick?: (coords: [number, number]) => void; // [lat, lng]
}

export const RouteMap: React.FC<RouteMapProps> = ({
  originCoords,
  destCoords,
  routeCoordinates = [],
  onMapClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const tileUrl = import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Style configuration
    let mapStyle: any;
    if (tileUrl) {
      mapStyle = {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    } else {
      // Plain background when no tile url is configured
      mapStyle = {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'plain-bg',
            type: 'background',
            paint: { 'background-color': '#0f172a' }
          }
        ]
      };
    }

    const defaultCenter: [number, number] = [80.24, 13.06]; // Chennai coordinates [lng, lat]
    const initialCenter: [number, number] = originCoords
      ? [originCoords[1], originCoords[0]]
      : defaultCenter;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: initialCenter,
      zoom: 12,
      attributionControl: false // Handled manually below to ensure exact text
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.lngLat.lat, e.lngLat.lng]);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers and Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Origin marker
    if (originCoords) {
      if (!originMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs';
        el.innerText = 'A';
        originMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([originCoords[1], originCoords[0]])
          .addTo(map);
      } else {
        originMarkerRef.current.setLngLat([originCoords[1], originCoords[0]]);
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // Destination marker
    if (destCoords) {
      if (!destMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 bg-rose-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs';
        el.innerText = 'B';
        destMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([destCoords[1], destCoords[0]])
          .addTo(map);
      } else {
        destMarkerRef.current.setLngLat([destCoords[1], destCoords[0]]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // Fit bounds if both points exist
    if (originCoords && destCoords) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([originCoords[1], originCoords[0]]);
      bounds.extend([destCoords[1], destCoords[0]]);
      map.fitBounds(bounds, { padding: 45, maxZoom: 14 });
    }

    // Draw route line
    const updateRoute = () => {
      if (!map.isStyleLoaded()) return;

      const sourceId = 'route-source';
      const layerId = 'route-layer';

      let lineCoords: [number, number][] = [];
      if (routeCoordinates.length > 0) {
        lineCoords = routeCoordinates;
      } else if (originCoords && destCoords) {
        lineCoords = [
          [originCoords[1], originCoords[0]],
          [destCoords[1], destCoords[0]]
        ];
      }

      const geojsonData: any = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: lineCoords
        }
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
      } else if (lineCoords.length >= 2) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojsonData
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#f59e0b',
            'line-width': 5,
            'line-opacity': 0.85
          }
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateRoute();
    } else {
      map.once('load', updateRoute);
    }
  }, [originCoords, destCoords, routeCoordinates]);

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Explicit OpenStreetMap Attribution */}
      <div className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-sm text-[10px] text-white/90 px-2 py-0.5 rounded pointer-events-none">
        © OpenStreetMap contributors
      </div>
    </div>
  );
};
