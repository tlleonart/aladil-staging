"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// Fix Leaflet default marker icon issue
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

interface Lab {
  id: string;
  name: string;
  countryCode: string;
  city: string | null;
  websiteUrl: string | null;
  coordinates: { lat: number; lng: number };
  countryName: string;
  logoAsset: {
    bucket: string;
    path: string;
  } | null;
}

interface MapViewControllerProps {
  selectedLab: Lab | undefined;
}

const MapViewController = ({ selectedLab }: MapViewControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLab) {
      map.setView(
        [selectedLab.coordinates.lat, selectedLab.coordinates.lng],
        6,
        {
          animate: true,
        },
      );
    }
  }, [map, selectedLab]);

  return null;
};

interface PartnersMapProps {
  labs: Lab[];
  selectedLab: string | null;
  onSelectLab: (id: string) => void;
}

export default function PartnersMap({
  labs,
  selectedLab,
  onSelectLab,
}: PartnersMapProps) {
  const selectedLabData = labs.find((lab) => lab.id === selectedLab);

  // Calculate center of all labs
  const centerLat =
    labs.reduce((sum, lab) => sum + lab.coordinates.lat, 0) / labs.length;
  const centerLng =
    labs.reduce((sum, lab) => sum + lab.coordinates.lng, 0) / labs.length;

  return (
    <MapContainer
      center={[centerLat || -15, centerLng || -60]}
      zoom={3}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={false}
      zoomControl={true}
      dragging={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {labs.map((lab) => (
        <Marker
          key={lab.id}
          position={[lab.coordinates.lat, lab.coordinates.lng]}
          icon={selectedLab === lab.id ? selectedIcon : defaultIcon}
          eventHandlers={{
            click: () => onSelectLab(lab.id),
          }}
        >
          <Popup>
            <div className="flex flex-col items-center text-center p-1 min-w-[150px]">
              <h3 className="text-sm font-semibold mb-2">{lab.name}</h3>
              {lab.logoAsset && (
                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-md p-1 mb-2 border">
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${lab.logoAsset.bucket}/${lab.logoAsset.path}`}
                    alt={lab.name}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              )}
              <p className="text-xs text-gray-600">
                {lab.city ? `${lab.city}, ` : ""}
                {lab.countryName}
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

      <MapViewController selectedLab={selectedLabData} />
    </MapContainer>
  );
}
