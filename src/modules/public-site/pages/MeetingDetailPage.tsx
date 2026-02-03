import type { Prisma } from "@prisma/client";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  ImageIcon,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: {
    coverAsset: true;
    hostLab: { select: { id: true; name: true } };
    topicsPdfAsset: true;
    gallery: { include: { asset: true } };
  };
}>;

interface MeetingDetailPageProps {
  meeting: MeetingWithRelations;
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

export const MeetingDetailPage = ({ meeting }: MeetingDetailPageProps) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="bg-white">
      {/* Hero Section with Cover Image */}
      <section className="relative">
        {/* Cover Image Background */}
        {meeting.coverAsset && (
          <div className="absolute inset-0 h-[400px] md:h-[500px]">
            <img
              src={`${supabaseUrl}/storage/v1/object/public/${meeting.coverAsset.bucket}/${meeting.coverAsset.path}`}
              alt={meeting.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/70 to-blue-900/40" />
          </div>
        )}

        {/* Content */}
        <div
          className={`relative ${meeting.coverAsset ? "pt-32 pb-16 md:pt-48 md:pb-24" : "py-16 md:py-24 bg-gradient-to-br from-blue-600 to-blue-800"} text-white`}
        >
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
              <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
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

              {/* Content (Rich Text) - content is admin-created and trusted */}
              {meeting.content && (
                <div>
                  <Separator className="my-8" />
                  <div className="prose prose-lg max-w-none text-gray-600">
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

              {/* Gallery */}
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
                        className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden"
                      >
                        {item.asset?.path ? (
                          <img
                            src={`${supabaseUrl}/storage/v1/object/public/${item.asset.bucket}/${item.asset.path}`}
                            alt={item.asset.filename || "Gallery image"}
                            className="w-full h-full object-cover"
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
                        href={`${supabaseUrl}/storage/v1/object/public/${meeting.topicsPdfAsset.bucket}/${meeting.topicsPdfAsset.path}`}
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
