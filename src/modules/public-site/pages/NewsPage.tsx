"use client";

import { Loader2, Newspaper } from "lucide-react";
import { useQuery } from "@/modules/core/orpc";
import { orpc } from "@/modules/core/orpc/client";
import { NewsCard } from "../components/NewsCard";

export const NewsPage = () => {
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["news", "listPublished"],
    queryFn: () => orpc.news.listPublished({ limit: 50 }),
  });

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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando noticias...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-600">
                Error al cargar las noticias. Por favor intente de nuevo.
              </p>
            </div>
          )}

          {/* Empty State */}
          {posts && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No hay noticias disponibles
              </h3>
              <p className="text-gray-500">
                Vuelve pronto para ver las ultimas novedades.
              </p>
            </div>
          )}

          {/* News Grid */}
          {posts && posts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <NewsCard
                  key={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  publishedAt={post.publishedAt}
                  authorName={post.author?.name}
                  coverUrl={
                    post.coverAsset
                      ? `/api/storage/${post.coverAsset.bucket}/${post.coverAsset.path}`
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
