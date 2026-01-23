"use client";

import { Loader2 } from "lucide-react";
import { orpc, useQuery } from "@/modules/core/orpc";
import { ExecutiveCard } from "../components/ExecutiveCard";

export const ExecutivePage = () => {
  const {
    data: members,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["executive", "listPublic"],
    queryFn: () => orpc.executive.listPublic({ limit: 50 }),
  });

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Comite Ejecutivo
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Conoce a los miembros del Comite Ejecutivo de ALADIL
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Liderazgo de ALADIL
            </h2>
            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
              <p>
                El Comite Ejecutivo de ALADIL esta conformado por destacados
                directores de laboratorios de investigacion de toda America
                Latina, quienes lideran los esfuerzos de colaboracion cientifica
                y el desarrollo institucional de nuestra asociacion.
              </p>
              <p>
                Cada miembro aporta su experiencia y vision para fortalecer los
                lazos entre instituciones de investigacion y promover la
                excelencia cientifica en la region.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Members Grid Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Miembros del Comite
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Representantes de instituciones de investigacion de America Latina
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando miembros...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-600">
                Error al cargar los miembros del comite ejecutivo.
              </p>
              <p className="text-gray-500 mt-2">
                Por favor, intenta de nuevo mas tarde.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && members?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-600">
                No hay miembros del comite ejecutivo disponibles en este
                momento.
              </p>
            </div>
          )}

          {/* Members Grid */}
          {!isLoading && !error && members && members.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((member) => (
                <ExecutiveCard
                  key={member.id}
                  fullName={member.fullName}
                  position={member.position}
                  countryCode={member.countryCode}
                  labName={member.lab?.name}
                  photoUrl={
                    member.photoAsset
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${member.photoAsset.bucket}/${member.photoAsset.path}`
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Forma Parte de ALADIL
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Si tu laboratorio de investigacion desea formar parte de nuestra red
            de colaboracion cientifica, te invitamos a conocer mas sobre como
            unirte a ALADIL.
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
