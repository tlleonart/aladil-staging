import { Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/modules/core/db";

export const metadata: Metadata = {
  title: "Reuniones Anteriores | ALADIL",
  description:
    "Historial de reuniones de ALADIL desde 2004. Explora todos los encuentros anuales de directores de laboratorios de investigación de América Latina.",
};

async function getPastMeetings() {
  const today = new Date();

  const meetings = await prisma.meeting.findMany({
    where: {
      status: "PUBLISHED",
      startDate: { lt: today },
    },
    orderBy: { startDate: "desc" },
    include: {
      coverAsset: true,
      hostLab: { select: { id: true, name: true } },
    },
  });

  return meetings;
}

export default async function PastMeetingsPage() {
  const meetings = await getPastMeetings();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Reuniones Anteriores
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Más de dos décadas de encuentros que han fortalecido la
              colaboración científica en América Latina
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {meetings.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No hay reuniones anteriores registradas.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  Mostrando {meetings.length} reuniones realizadas
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                  <Link key={meeting.id} href={`/meetings/${meeting.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
                        {meeting.coverAsset ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${meeting.coverAsset.bucket}/${meeting.coverAsset.path}`}
                            alt={meeting.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                            <Calendar className="h-12 w-12 text-blue-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            Reunión #{meeting.number}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                          {meeting.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {meeting.city}, {meeting.country}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(meeting.startDate).toLocaleDateString(
                                "es-ES",
                                {
                                  year: "numeric",
                                  month: "long",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {meetings.length > 0 && (
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
                <div className="mt-2 text-gray-600">Países anfitriones</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-blue-600">
                  {meetings.length > 0
                    ? new Date().getFullYear() -
                      new Date(
                        meetings[meetings.length - 1].startDate,
                      ).getFullYear()
                    : 0}
                </div>
                <div className="mt-2 text-gray-600">Años de historia</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
