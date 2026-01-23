"use client";

import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@/modules/core/orpc";
import { orpc } from "@/modules/core/orpc/client";

interface MeetingDetailPageProps {
  slug: string;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateRange = (startDate: Date, endDate?: Date | null): string => {
  const start = new Date(startDate);
  if (!endDate) {
    return formatDate(start);
  }

  const end = new Date(endDate);

  // Same month and year
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${start.getDate()} - ${end.getDate()} de ${new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(start)}`;
  }

  // Different months
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const MeetingDetailPage = ({ slug }: MeetingDetailPageProps) => {
  const {
    data: meeting,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["meetings", "getBySlug", slug],
    queryFn: () => orpc.meetings.getBySlug({ slug }),
  });

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando reunion...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Reunion no encontrada
            </h1>
            <p className="text-gray-600 mb-8">
              La reunion que buscas no existe o no esta disponible.
            </p>
            <Link href="/meetings">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Reuniones
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/meetings"
            className="inline-flex items-center text-blue-100 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Reuniones
          </Link>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-3xl font-bold">#{meeting.number}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                {meeting.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {meeting.city}, {meeting.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    {formatDateRange(meeting.startDate, meeting.endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Summary */}
              {meeting.summary && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Resumen
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {meeting.summary}
                  </p>
                </div>
              )}

              {/* Content (Rich Text) */}
              {meeting.content && (
                <div>
                  <Separator className="my-8" />
                  <div className="prose prose-lg max-w-none text-gray-600">
                    {/*
                      Rich text content rendering
                      The content is stored as JSON from TipTap/Slate
                      For now, we'll render it as a simple string if it's text,
                      or stringify the JSON for debugging purposes.
                      A proper implementation would use a rich text renderer.
                    */}
                    {typeof meeting.content === "string" ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: meeting.content }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {JSON.stringify(meeting.content, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gallery Placeholder */}
              {meeting.gallery && meeting.gallery.length > 0 && (
                <div>
                  <Separator className="my-8" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="h-6 w-6" />
                    Galeria de Imagenes
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {meeting.gallery.map((item) => (
                      <div
                        key={item.id}
                        className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center"
                      >
                        {item.asset?.path ? (
                          <img
                            src={`/api/storage/${item.asset.bucket}/${item.asset.path}`}
                            alt={item.asset.filename || "Gallery image"}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for gallery */}
              {(!meeting.gallery || meeting.gallery.length === 0) && (
                <div>
                  <Separator className="my-8" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="h-6 w-6" />
                    Galeria de Imagenes
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No hay imagenes disponibles para esta reunion.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Detalles de la Reunion
                </h3>
                <div className="space-y-4">
                  {/* Meeting Number */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        Numero de Reunion
                      </div>
                      <div className="font-medium text-gray-900">
                        #{meeting.number}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Ubicacion</div>
                      <div className="font-medium text-gray-900">
                        {meeting.city}, {meeting.country}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Fecha</div>
                      <div className="font-medium text-gray-900">
                        {formatDateRange(meeting.startDate, meeting.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Host Lab */}
                  {meeting.hostLab && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Laboratorio Anfitrion
                        </div>
                        <div className="font-medium text-gray-900">
                          {meeting.hostLab.name}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Host Name (if no lab) */}
                  {!meeting.hostLab && meeting.hostName && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Anfitrion</div>
                        <div className="font-medium text-gray-900">
                          {meeting.hostName}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="pt-4 border-t border-gray-200">
                    <Badge variant="secondary">Publicada</Badge>
                  </div>

                  {/* Topics PDF */}
                  {meeting.topicsPdfAsset && (
                    <div className="pt-4">
                      <a
                        href={`/api/storage/${meeting.topicsPdfAsset.bucket}/${meeting.topicsPdfAsset.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <FileText className="h-4 w-4" />
                        Descargar temas (PDF)
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Meetings CTA */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ver todas las reuniones
          </h2>
          <p className="text-gray-600 mb-6">
            Explora el historial completo de reuniones de ALADIL
          </p>
          <Link href="/meetings">
            <Button size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Reuniones
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
