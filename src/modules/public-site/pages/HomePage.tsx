import {
  ArrowRight,
  Award,
  Calendar,
  Eye,
  Handshake,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Newspaper,
  Scale,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import Image from "next/image";
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
import { ContactSection } from "../components/ContactSection";
import { HeroCarousel } from "../components/HeroCarousel";
import { PartnersSection } from "../components/PartnersSection";

// Fetch data for the home page
async function getHomePageData() {
  const [meetings, news, executiveMembers, laboratories] = await Promise.all([
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
    // Get all active labs for the map
    prisma.lab.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        logoAsset: true,
      },
    }),
  ]);

  return { meetings, news, executiveMembers, laboratories };
}

// About Section Component
const AboutSection = () => (
  <section id="quienes-somos" className="py-16 md:py-24 bg-gray-50">
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
    </div>
  </section>
);

// Values data
const VALUES = [
  {
    icon: Award,
    title: "Calidad",
    description:
      "Compromiso con los más altos estándares en servicios, procesos y tecnologías. Nuestros laboratorios miembros cumplen con normativas internacionales y se mantienen a la vanguardia de los avances científicos.",
    color: "bg-blue-500",
  },
  {
    icon: Handshake,
    title: "Colaboración",
    description:
      "Promovemos el trabajo conjunto mediante el intercambio abierto entre laboratorios, profesionales e instituciones regionales para fortalecer el desarrollo diagnóstico.",
    color: "bg-emerald-500",
  },
  {
    icon: Eye,
    title: "Transparencia",
    description:
      "Comunicación clara, abierta y accesible. Todas nuestras prácticas son visibles y comprensibles para nuestros miembros y la comunidad.",
    color: "bg-cyan-500",
  },
  {
    icon: Scale,
    title: "Ética",
    description:
      "Actuamos con integridad, responsabilidad y respeto hacia pacientes, colaboradores y la sociedad en su conjunto.",
    color: "bg-violet-500",
  },
  {
    icon: HeartHandshake,
    title: "Confianza",
    description:
      "Fundamento de nuestras relaciones institucionales, fomentando el apoyo mutuo entre miembros y la seguridad hacia las oportunidades de crecimiento.",
    color: "bg-rose-500",
  },
  {
    icon: Lightbulb,
    title: "Innovación",
    description:
      "Enfoque estratégico en la adopción de tecnologías emergentes, desarrollo de metodologías avanzadas e investigación científica para la mejora continua.",
    color: "bg-amber-500",
  },
];

// Values Section Component
const ValuesSection = () => (
  <section className="py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Valores Institucionales
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Los principios que guían nuestro trabajo y compromiso con la comunidad
          científica latinoamericana
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {VALUES.map((value) => (
          <div
            key={value.title}
            className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${value.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
            >
              <value.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {value.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">{value.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// History Section Component
const HistorySection = () => (
  <section className="py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Nuestra Historia
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Más de dos décadas impulsando la excelencia en el diagnóstico clínico
          en Latinoamérica
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-lg">
          <Image
            src="/history.jpg"
            alt="Fundadores de ALADIL durante la reunión inaugural en Viña del Mar, Chile, 2004"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            className="object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>

        <div className="space-y-5">
          <p className="text-base md:text-lg leading-relaxed text-gray-700">
            En mayo de 2004, el Dr. Ivo Sapunar (1932–2023), destacado referente
            del ámbito del diagnóstico clínico en Santiago de Chile, convocó a
            una reunión en la ciudad de Viña del Mar con reconocidos
            profesionales de la región: la Dra. Clara Corona de Lau, de
            Biomédica de Referencia (Ciudad de México, México); el Dr. Alex
            Colichón, de MedLab (Lima, Perú); el Dr. Fabián Fay, de Cibic
            Laboratorios (Rosario, Argentina); y el Dr. Rui Maciel, de
            Laboratorios Fleury (São Paulo, Brasil).
          </p>
          <p className="text-base md:text-lg leading-relaxed text-gray-700">
            A partir de este encuentro, surgió la iniciativa de constituir una
            asociación latinoamericana de laboratorios de análisis clínicos, con
            el objetivo de fortalecer sus capacidades comerciales, promover la
            innovación científica y fomentar el desarrollo profesional mediante
            el intercambio de conocimientos, experiencias locales y casos de
            éxito.
          </p>
          <p className="text-base md:text-lg leading-relaxed text-gray-700">
            En 2004, en Viña del Mar, Chile, quedó formalmente constituida la
            Asociación de Laboratorios de Diagnóstico Latinoamericanos (ALADIL).
          </p>
          <p className="text-base md:text-lg leading-relaxed text-gray-700">
            Desde su creación, y a lo largo de más de dos décadas, ALADIL ha
            sumado laboratorios de referencia en diversos países de la región.
            La realización de más de 35 reuniones presenciales ha permitido
            consolidar una red colaborativa que impulsa el crecimiento sostenido
            y la mejora continua de todos sus miembros.
          </p>
        </div>
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

// Main HomePage Component
export const HomePage = async () => {
  const { meetings, news, executiveMembers, laboratories } =
    await getHomePageData();

  return (
    <div className="bg-white">
      <HeroCarousel />
      <AboutSection />
      <ValuesSection />
      <HistorySection />
      <PartnersSection laboratories={laboratories} />
      <MeetingsSection meetings={meetings} />
      <ExecutiveSection members={executiveMembers} />
      <NewsSection news={news} />
      <ContactSection />
    </div>
  );
};
