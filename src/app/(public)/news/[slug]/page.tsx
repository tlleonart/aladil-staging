import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import { generateArticleMetadata } from "@/app/(public)/metadata";
import { createAnonymousConvexClient } from "@/modules/core/convex/server";
import { NewsDetailPage } from "@/modules/public-site/pages/NewsDetailPage";

export const dynamic = "force-dynamic";

interface NewsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const convex = createAnonymousConvexClient();
  try {
    const post = await convex.query(api.news.getBySlug, { slug });
    const description =
      post.excerpt ||
      `Lee esta noticia de ALADIL: ${post.title}. Noticias y actualizaciones de la comunidad cientifica latinoamericana.`;
    return generateArticleMetadata({
      title: post.title,
      description,
      path: `/news/${slug}`,
      publishedTime: post.publishedAt ? new Date(post.publishedAt) : undefined,
      modifiedTime: new Date(post._creationTime),
      author: post.author?.name || "ALADIL",
      section: "Noticias",
      tags: ["ALADIL", "noticias", "ciencia", "laboratorios"],
    });
  } catch {
    return {
      title: "Noticia no encontrada | ALADIL",
      robots: { index: false, follow: false },
    };
  }
}

export default async function NewsArticlePage({ params }: NewsPageProps) {
  const { slug } = await params;
  return <NewsDetailPage slug={slug} />;
}
