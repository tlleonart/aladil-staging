"use client";

import { ExternalLink, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";

// Dynamic import to avoid SSR issues with Leaflet
const PartnersMap = dynamic(() => import("./PartnersMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <p className="text-gray-500">Cargando mapa...</p>
    </div>
  ),
});

// Coordinates mapping by country code (matching legacy project)
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  AR: { lat: -32.9575, lng: -60.6394 }, // Rosario - Cibic
  BR: { lat: -23.501944, lng: -47.457777 }, // Sorocaba - Diagnóstico do Brasil
  UY: { lat: -34.866666, lng: -56.166666 }, // Montevideo - LAC
  DO: { lat: 18.4624, lng: -69.936111 }, // Santo Domingo - Amadita
  PY: { lat: -25.3, lng: -57.633333 }, // Asunción - Meyer Lab
  CR: { lat: 9.932511, lng: -84.07958 }, // San José - LABIN
  BO: { lat: -17.17134, lng: -63.325783 }, // Santa Cruz - Hospital Dockweiler
  CO: { lat: 6.244747, lng: -75.574827 }, // Medellín - Lab Médico de Referencia
  GT: { lat: 15.464032, lng: -90.134767 }, // Guatemala - Biotest
  HN: { lat: 14.105713, lng: -87.204008 }, // Tegucigalpa - LCM Honduras
};

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina",
  BR: "Brasil",
  UY: "Uruguay",
  DO: "República Dominicana",
  PY: "Paraguay",
  CR: "Costa Rica",
  BO: "Bolivia",
  CO: "Colombia",
  GT: "Guatemala",
  HN: "Honduras",
};

interface Lab {
  id: string;
  name: string;
  countryCode: string;
  city: string | null;
  websiteUrl: string | null;
  logoAsset: {
    bucket: string;
    path: string;
  } | null;
}

interface PartnersSectionProps {
  laboratories: Lab[];
}

export const PartnersSection = ({ laboratories }: PartnersSectionProps) => {
  const [selectedLab, setSelectedLab] = useState<string | null>(null);

  // Enrich labs with coordinates
  const labsWithCoords = laboratories.map((lab) => ({
    ...lab,
    coordinates: COUNTRY_COORDINATES[lab.countryCode] || { lat: -15, lng: -60 },
    countryName: COUNTRY_NAMES[lab.countryCode] || lab.countryCode,
  }));

  const handleLabClick = (labId: string) => {
    setSelectedLab(labId === selectedLab ? null : labId);
  };

  return (
    <section id="socios" className="py-16 md:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestros Socios
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            ALADIL reúne a los principales laboratorios de América Latina,
            trabajando juntos para impulsar la innovación y la excelencia en la
            región.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Map */}
          <div className="w-full lg:w-1/2 aspect-[4/3] lg:aspect-auto lg:h-[500px] rounded-xl overflow-hidden shadow-lg relative z-0">
            <PartnersMap
              labs={labsWithCoords}
              selectedLab={selectedLab}
              onSelectLab={setSelectedLab}
            />
          </div>

          {/* Partners List */}
          <div className="w-full lg:w-1/2 lg:h-[500px]">
            <Card className="h-full shadow-lg">
              <CardContent className="p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-4">
                  Laboratorios Miembros
                </h3>
                <div className="space-y-3 overflow-auto flex-1 pr-2">
                  {labsWithCoords.map((lab) => (
                    <button
                      type="button"
                      key={lab.id}
                      onClick={() => handleLabClick(lab.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedLab === lab.id
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {lab.logoAsset ? (
                          <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${lab.logoAsset.bucket}/${lab.logoAsset.path}`}
                              alt={lab.name}
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {lab.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {lab.city ? `${lab.city}, ` : ""}
                            {lab.countryName}
                          </p>
                          {lab.websiteUrl && (
                            <a
                              href={lab.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              Visitar sitio web
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
