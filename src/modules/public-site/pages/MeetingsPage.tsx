import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/modules/core/db";

// Fetch published meetings
async function getMeetings() {
  const meetings = await prisma.meeting.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { number: "desc" },
    take: 50,
    include: {
      coverAsset: true,
      hostLab: { select: { id: true, name: true } },
    },
  });

  return meetings;
}

export const MeetingsPage = async () => {
  const meetings = await getMeetings();

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
          {meetings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600">
                No hay reuniones publicadas en este momento.
              </p>
            </div>
          ) : (
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
                          Reunion #{meeting.number}
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
