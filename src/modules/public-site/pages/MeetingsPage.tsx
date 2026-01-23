"use client";

import { Calendar, Loader2 } from "lucide-react";
import { useQuery } from "@/modules/core/orpc";
import { orpc } from "@/modules/core/orpc/client";
import { MeetingCard } from "../components/MeetingCard";

export const MeetingsPage = () => {
  const {
    data: meetings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["meetings", "listPublished"],
    queryFn: () => orpc.meetings.listPublished({ limit: 50 }),
  });

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Reuniones
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Encuentros anuales de directores de laboratorios de investigacion
              de toda America Latina
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Nuestras Reuniones
              </h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Desde su fundacion, ALADIL organiza reuniones anuales que reunen a
              directores de laboratorios de investigacion de toda America
              Latina. Estos encuentros son espacios de intercambio de
              conocimientos, colaboracion cientifica y fortalecimiento de la red
              de investigacion regional.
            </p>
          </div>

          {/* Meetings Grid */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando reuniones...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-600">
                Error al cargar las reuniones. Por favor intente de nuevo.
              </p>
            </div>
          )}

          {meetings && meetings.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-600">
                No hay reuniones publicadas en este momento.
              </p>
            </div>
          )}

          {meetings && meetings.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  number={meeting.number}
                  title={meeting.title}
                  slug={meeting.slug}
                  city={meeting.city}
                  country={meeting.country}
                  startDate={meeting.startDate}
                  endDate={meeting.endDate}
                  status={meeting.status}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {meetings && meetings.length > 0 && (
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-blue-600">
                  {meetings.length}
                </div>
                <div className="mt-2 text-gray-600">Reuniones realizadas</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-blue-600">
                  {new Set(meetings.map((m) => m.country)).size}
                </div>
                <div className="mt-2 text-gray-600">Paises anfitriones</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-blue-600">
                  20+
                </div>
                <div className="mt-2 text-gray-600">Anos de historia</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
