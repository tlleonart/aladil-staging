"use client";

import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Santiago, Chile coordinates
const SANTIAGO_COORDS = { lat: -33.4489, lng: -70.6693 };

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

export const ContactMap = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden shadow-sm">
      <MapContainer
        center={[SANTIAGO_COORDS.lat, SANTIAGO_COORDS.lng]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
        dragging={true}
        attributionControl={true}
        aria-label="Mapa de ubicacion de ALADIL en Santiago, Chile"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <Marker
          position={[SANTIAGO_COORDS.lat, SANTIAGO_COORDS.lng]}
          icon={markerIcon}
        >
          <Popup>
            <div className="text-center p-1">
              <h3 className="text-base font-semibold mb-1">
                Secretaria ALADIL
              </h3>
              <p className="text-sm text-gray-600">Santiago, Chile</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
