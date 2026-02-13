import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapStop } from '../hooks/useMapData'

// Fix default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

function createNumberedIcon(num: number, isFirst: boolean) {
  const color = isFirst ? '#2563eb' : '#475569'
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function FitBounds({ stops }: { stops: MapStop[] }) {
  const map = useMap()

  useMemo(() => {
    if (stops.length === 0) return
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [stops, map])

  return null
}

interface RouteMapProps {
  stops: MapStop[]
}

const DEFAULT_CENTER: [number, number] = [54.99, 73.37] // Omsk

export function RouteMap({ stops }: RouteMapProps) {
  const polylinePositions = stops.map((s): [number, number] => [s.lat, s.lng])

  if (stops.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900">
        <p className="text-slate-500">Нет клиентов с координатами для этого дня</p>
      </div>
    )
  }

  return (
    <div className="isolate overflow-hidden rounded-lg border border-slate-700">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        className="h-[500px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stops.map((stop) => (
          <Marker
            key={stop.position}
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(stop.position, stop.position === 1)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">
                  #{stop.position} {stop.clientName}
                </div>
                {stop.address && (
                  <div className="text-gray-600">{stop.address}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {polylinePositions.length >= 2 && (
          <Polyline
            positions={polylinePositions}
            color="#2563eb"
            weight={3}
            opacity={0.7}
            dashArray="8 4"
          />
        )}

        <FitBounds stops={stops} />
      </MapContainer>
    </div>
  )
}
