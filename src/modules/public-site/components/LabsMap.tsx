"use client";

import L from "leaflet";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// Custom marker icons
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const selectedIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconSize: [30, 50],
  iconAnchor: [15, 50],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [50, 50],
});

// Country coordinates mapping
const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  AR: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
  BR: { lat: -23.5505, lng: -46.6333 }, // São Paulo
  CL: { lat: -33.4489, lng: -70.6693 }, // Santiago
  CO: { lat: 4.711, lng: -74.0721 }, // Bogotá
  MX: { lat: 19.4326, lng: -99.1332 }, // Mexico City
  PE: { lat: -12.0464, lng: -77.0428 }, // Lima
  UY: { lat: -34.9011, lng: -56.1645 }, // Montevideo
  DO: { lat: 18.4861, lng: -69.9312 }, // Santo Domingo
  PY: { lat: -25.2637, lng: -57.5759 }, // Asunción
  BO: { lat: -17.7892, lng: -63.1975 }, // Santa Cruz
  CR: { lat: 9.9281, lng: -84.0907 }, // San José
  GT: { lat: 14.6349, lng: -90.5069 }, // Guatemala City
  HN: { lat: 14.0723, lng: -87.1921 }, // Tegucigalpa
  EC: { lat: -0.1807, lng: -78.4678 }, // Quito
  VE: { lat: 10.4806, lng: -66.9036 }, // Caracas
  PA: { lat: 8.9824, lng: -79.5199 }, // Panama City
};

interface Lab {
  id: string;
  name: string;
  countryCode: string;
  city: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
}

interface LabsMapProps {
  labs: Lab[];
  selectedLabId: string | null;
  onSelectLab: (id: string | null) => void;
}

// Component to handle map view changes
function ChangeMapView({
  coords,
  zoom,
}: {
  coords: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([coords.lat, coords.lng], zoom);
  }, [map, coords, zoom]);

  return null;
}

export function LabsMap({ labs, selectedLabId, onSelectLab }: LabsMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get coordinates for labs
  const labsWithCoords = labs
    .map((lab) => ({
      ...lab,
      coordinates: countryCoordinates[lab.countryCode] || null,
    }))
    .filter((lab) => lab.coordinates !== null);

  // Calculate center of all labs
  const centerLat =
    labsWithCoords.length > 0
      ? labsWithCoords.reduce(
          (sum, lab) => sum + (lab.coordinates?.lat || 0),
          0,
        ) / labsWithCoords.length
      : -15;
  const centerLng =
    labsWithCoords.length > 0
      ? labsWithCoords.reduce(
          (sum, lab) => sum + (lab.coordinates?.lng || 0),
          0,
        ) / labsWithCoords.length
      : -60;

  // Get selected lab coordinates
  const selectedLab = selectedLabId
    ? labsWithCoords.find((lab) => lab.id === selectedLabId)
    : null;
  const selectedCoords = selectedLab?.coordinates;

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={3}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={false}
      zoomControl={true}
      dragging={true}
      attributionControl={true}
      aria-label="Mapa de ubicaciones de laboratorios miembros de ALADIL"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {labsWithCoords.map((lab) => (
        <Marker
          key={lab.id}
          position={[lab.coordinates?.lat, lab.coordinates?.lng]}
          icon={selectedLabId === lab.id ? selectedIcon : defaultIcon}
          eventHandlers={{
            click: () => {
              onSelectLab(lab.id);
            },
          }}
        >
          <Popup>
            <div className="flex flex-col items-center text-center p-1 min-w-[150px]">
              <h3 className="text-base font-semibold mb-2">{lab.name}</h3>
              {lab.logoUrl && (
                <div className="w-20 h-20 flex items-center justify-center bg-white rounded-md p-1 mb-2">
                  <Image
                    src={lab.logoUrl}
                    alt={`Logo de ${lab.name}`}
                    width={80}
                    height={80}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              )}
              <p className="text-sm text-gray-600">
                {lab.city ? `${lab.city}, ` : ""}
                {lab.countryCode}
              </p>
              {lab.websiteUrl && (
                <a
                  href={lab.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Visitar sitio web
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {selectedCoords && <ChangeMapView coords={selectedCoords} zoom={5} />}
    </MapContainer>
  );
}
