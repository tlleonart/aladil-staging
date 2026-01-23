"use client";

import { AlertCircle, Grid3X3, Loader2, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orpc, useQuery } from "@/modules/core/orpc";
import { LabCard } from "@/modules/public-site/components";

// Dynamic import for Leaflet map (SSR disabled)
const LabsMap = dynamic(
  () =>
    import("@/modules/public-site/components/LabsMap").then(
      (mod) => mod.LabsMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="animate-pulse text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    ),
  },
);

export const LaboratoriesPage = () => {
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const {
    data: labs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["labs", "publicList"],
    queryFn: () => orpc.labs.publicList({ limit: 50 }),
  });

  // Transform labs for map component
  const labsForMap =
    labs?.map((lab) => ({
      id: lab.id,
      name: lab.name,
      countryCode: lab.countryCode,
      city: lab.city,
      websiteUrl: lab.websiteUrl,
      logoUrl: lab.logoAsset
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${lab.logoAsset.bucket}/${lab.logoAsset.path}`
        : null,
    })) || [];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Socios
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Laboratorios Miembros de ALADIL
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-12 md:py-16 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Nuestra Red de Laboratorios
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              ALADIL reune a prestigiosos laboratorios de investigacion de toda
              America Latina. Nuestros miembros representan instituciones
              líderes en investigacion cientifica, comprometidas con la
              excelencia, la colaboracion y el avance del conocimiento en
              beneficio de la region.
            </p>
          </div>
        </div>
      </section>

      {/* Labs Section with Map/Grid Toggle */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* View Toggle */}
          <div className="flex justify-between items-center mb-8">
            <p className="text-gray-500">
              {labs?.length || 0} laboratorio
              {(labs?.length || 0) !== 1 ? "s" : ""} miembro
              {(labs?.length || 0) !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Mapa
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grilla
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="mt-4 text-gray-600">Cargando laboratorios...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="mt-4 text-gray-600">
                Error al cargar los laboratorios. Por favor, intente nuevamente.
              </p>
            </div>
          )}

          {labs && labs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-600">
                No hay laboratorios disponibles en este momento.
              </p>
            </div>
          )}

          {labs && labs.length > 0 && viewMode === "map" && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Map */}
              <div className="w-full lg:flex-[2] h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-md">
                <LabsMap
                  labs={labsForMap}
                  selectedLabId={selectedLabId}
                  onSelectLab={setSelectedLabId}
                />
              </div>

              {/* Labs List */}
              <Card className="lg:flex-1 lg:max-w-md lg:h-[600px] overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">Laboratorios</h3>
                </div>
                <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-3">
                  {labs.map((lab) => (
                    <button
                      key={lab.id}
                      type="button"
                      onClick={() => setSelectedLabId(lab.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedLabId === lab.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-medium text-gray-900">{lab.name}</p>
                      <p className="text-sm text-gray-500">
                        {lab.city ? `${lab.city}, ` : ""}
                        {lab.countryCode}
                      </p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {labs && labs.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {labs.map((lab) => (
                <LabCard
                  key={lab.id}
                  name={lab.name}
                  countryCode={lab.countryCode}
                  city={lab.city}
                  websiteUrl={lab.websiteUrl}
                  logoUrl={
                    lab.logoAsset
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${lab.logoAsset.bucket}/${lab.logoAsset.path}`
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            ¿Quieres ser parte de ALADIL?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Si tu laboratorio esta interesado en formar parte de nuestra red de
            colaboracion cientifica latinoamericana, contactanos para conocer
            mas sobre los requisitos y beneficios de la membresia.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contactanos
          </a>
        </div>
      </section>
    </div>
  );
};
