import { Calendar, Newspaper } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/modules/core/db";

// Fetch published news
async function getNews() {
  const news = await prisma.newsPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      coverAsset: true,
    },
  });

  return news;
}

export const NewsPage = async () => {
  const news = await getNews();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Noticias
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Mantente informado sobre las ultimas novedades, eventos y avances
              de ALADIL y la comunidad cientifica latinoamericana.
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
                <Newspaper className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Ultimas Noticias
              </h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Descubre las novedades mas recientes sobre las actividades de
              ALADIL, avances cientificos, eventos y colaboraciones de la
              comunidad de laboratorios de America Latina.
            </p>
          </div>

          {/* News Grid */}
          {news.length === 0 ? (
            <div className="text-center py-20">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No hay noticias publicadas en este momento.
              </p>
            </div>
          ) : (
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
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.publishedAt).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
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
          )}
        </div>
      </section>
    </div>
  );
};
