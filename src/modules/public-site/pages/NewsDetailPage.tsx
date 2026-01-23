"use client";

import { ArrowLeft, Calendar, FileText, Loader2, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/modules/core/orpc";
import { orpc } from "@/modules/core/orpc/client";

interface NewsDetailPageProps {
  slug: string;
}

const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

// Simple content renderer - handles JSON content or plain text
const renderContent = (content: unknown): React.ReactNode => {
  if (!content) return null;

  // If content is a string, render it as paragraphs
  if (typeof content === "string") {
    return content.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ));
  }

  // If content is an object (TipTap/Slate/etc JSON), try to render it
  if (typeof content === "object") {
    // Handle TipTap JSON format
    if (
      "type" in (content as object) &&
      (content as { type: string }).type === "doc"
    ) {
      const doc = content as {
        content?: Array<{ type: string; content?: Array<{ text?: string }> }>;
      };
      return doc.content?.map((node, index) => {
        if (node.type === "paragraph") {
          const text = node.content?.map((c) => c.text).join("") || "";
          return (
            <p key={index} className="mb-4">
              {text}
            </p>
          );
        }
        if (node.type === "heading") {
          const text = node.content?.map((c) => c.text).join("") || "";
          return (
            <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
              {text}
            </h2>
          );
        }
        return null;
      });
    }

    // Fallback: stringify the content
    return <p>{JSON.stringify(content)}</p>;
  }

  return null;
};

export const NewsDetailPage = ({ slug }: NewsDetailPageProps) => {
  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["news", "getBySlug", slug],
    queryFn: () => orpc.news.getBySlug({ slug }),
  });

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando noticia...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-white min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Noticia no encontrada
            </h1>
            <p className="text-gray-600 mb-8">
              La noticia que buscas no existe o no esta disponible.
            </p>
            <Link href="/news">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Noticias
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverUrl = post.coverAsset
    ? `/api/storage/${post.coverAsset.bucket}/${post.coverAsset.path}`
    : null;

  return (
    <div className="bg-white">
      {/* Back Navigation */}
      <div className="bg-gray-50 border-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Noticias
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Cover Image */}
        <div className="relative h-64 md:h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden mb-8 flex items-center justify-center">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-blue-400">
              <svg
                className="w-24 h-24"
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
          )}
        </div>

        {/* Article Meta */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-gray-500">
            {post.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={new Date(post.publishedAt).toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
              </div>
            )}
            {post.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author.name}</span>
              </div>
            )}
          </div>

          {post.excerpt && (
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Divider */}
        <hr className="border-gray-200 mb-8" />

        {/* Article Content */}
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          {renderContent(post.content)}
        </div>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Archivos Adjuntos
            </h2>
            <ul className="space-y-2">
              {post.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={`/api/storage/${attachment.asset.bucket}/${attachment.asset.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {attachment.asset.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Back to News CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/news">
            <Button size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ver todas las noticias
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
};
