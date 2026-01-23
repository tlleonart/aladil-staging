import {
  ArrowRight,
  Calendar,
  Eye,
  Mail,
  MapPin,
  Newspaper,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/modules/core/db";

// Fetch data for the home page
async function getHomePageData() {
  const [meetings, news, executiveMembers] = await Promise.all([
    // Get latest 3 published meetings
    prisma.meeting.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { startDate: "desc" },
      take: 3,
      include: {
        coverAsset: true,
      },
    }),
    // Get latest 3 published news posts
    prisma.newsPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: {
        coverAsset: true,
      },
    }),
    // Get first 4 active executive members
    prisma.executiveMember.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
      take: 4,
      include: {
        lab: { select: { id: true, name: true } },
        photoAsset: true,
      },
    }),
  ]);

  return { meetings, news, executiveMembers };
}

// Hero Section Component
const HeroSection = () => (
  <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-24 md:py-32 overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
    </div>
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          ALADIL
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
          Asociacion Latinoamericana de Directores de Instituciones de
          Laboratorio
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Link href="/about">Conoce mas sobre nosotros</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10"
          >
            <Link href="/contact">Contactanos</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

// About Section Component
const AboutSection = () => (
  <section className="py-16 md:py-24 bg-gray-50">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Sobre ALADIL
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Una organizacion que reune a directores de laboratorios de
          investigacion de toda America Latina, promoviendo la colaboracion
          cientifica y el desarrollo de la region.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <Card className="border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Mision</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600 text-base leading-relaxed">
              Promover la excelencia en la investigacion cientifica en America
              Latina a traves de la colaboracion, el intercambio de
              conocimientos y el fortalecimiento de las capacidades de los
              laboratorios de investigacion.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Vision</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600 text-base leading-relaxed">
              Ser la red de referencia para la colaboracion cientifica entre
              laboratorios de investigacion en America Latina, reconocida por su
              impacto en el avance del conocimiento y la innovacion.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      <div className="text-center mt-10">
        <Button asChild variant="outline">
          <Link href="/about" className="gap-2">
            Conoce mas sobre nuestra historia
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

// Meetings Section Props
interface MeetingsSectionProps {
  meetings: Awaited<ReturnType<typeof getHomePageData>>["meetings"];
}

// Meetings Section Component
const MeetingsSection = ({ meetings }: MeetingsSectionProps) => (
  <section className="py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Reuniones Recientes
          </h2>
          <p className="text-gray-600">
            Nuestros encuentros anuales de colaboracion cientifica
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/meetings" className="gap-2">
            Ver todas las reuniones
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {meetings.length > 0 ? (
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
                    <Badge variant="secondary">Reunion #{meeting.number}</Badge>
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
      ) : (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay reuniones publicadas aun.</p>
        </Card>
      )}
    </div>
  </section>
);

// Executive Section Props
interface ExecutiveSectionProps {
  members: Awaited<ReturnType<typeof getHomePageData>>["executiveMembers"];
}

// Executive Section Component
const ExecutiveSection = ({ members }: ExecutiveSectionProps) => (
  <section className="py-16 md:py-24 bg-gray-50">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Comite Ejecutivo
          </h2>
          <p className="text-gray-600">
            Los lideres que guian nuestra asociacion
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/executive" className="gap-2">
            Ver comite completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {members.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((member) => (
            <Card
              key={member.id}
              className="text-center hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
                  {member.photoAsset ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${member.photoAsset.bucket}/${member.photoAsset.path}`}
                      alt={member.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <Users className="h-10 w-10 text-blue-400" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{member.fullName}</CardTitle>
                <CardDescription className="text-blue-600 font-medium">
                  {member.position}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {member.lab && (
                  <p className="text-sm text-gray-500">{member.lab.name}</p>
                )}
                <Badge variant="outline" className="mt-2">
                  {member.countryCode}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No hay miembros del comite ejecutivo publicados aun.
          </p>
        </Card>
      )}
    </div>
  </section>
);

// News Section Props
interface NewsSectionProps {
  news: Awaited<ReturnType<typeof getHomePageData>>["news"];
}

// News Section Component
const NewsSection = ({ news }: NewsSectionProps) => (
  <section className="py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Ultimas Noticias
          </h2>
          <p className="text-gray-600">
            Mantente informado sobre nuestras actividades
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/news" className="gap-2">
            Ver todas las noticias
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {news.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((post) => (
            <Link key={post.id} href={`/news/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
                  {post.coverAsset ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${post.coverAsset.bucket}/${post.coverAsset.path}`}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <Newspaper className="h-12 w-12 text-blue-400" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  {post.publishedAt && (
                    <CardDescription>
                      {new Date(post.publishedAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  )}
                </CardHeader>
                {post.excerpt && (
                  <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay noticias publicadas aun.</p>
        </Card>
      )}
    </div>
  </section>
);

// CTA Section Component
const CTASection = () => (
  <section className="py-16 md:py-24 bg-blue-600 text-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
      <Mail className="h-12 w-12 mx-auto mb-6 text-blue-200" />
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Contactanos</h2>
      <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
        Tienes preguntas sobre ALADIL o te gustaria unirte a nuestra red de
        colaboracion cientifica? Estamos aqui para ayudarte.
      </p>
      <Button
        asChild
        size="lg"
        className="bg-white text-blue-600 hover:bg-blue-50"
      >
        <Link href="/contact" className="gap-2">
          Enviar mensaje
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  </section>
);

// Main HomePage Component
export const HomePage = async () => {
  const { meetings, news, executiveMembers } = await getHomePageData();

  return (
    <div className="bg-white">
      <HeroSection />
      <AboutSection />
      <MeetingsSection meetings={meetings} />
      <ExecutiveSection members={executiveMembers} />
      <NewsSection news={news} />
      <CTASection />
    </div>
  );
};
