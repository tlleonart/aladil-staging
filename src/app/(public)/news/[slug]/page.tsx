import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateArticleMetadata } from "@/app/(public)/metadata";
import { prisma } from "@/modules/core/db";
import { NewsDetailPage } from "@/modules/public-site/pages/NewsDetailPage";

interface NewsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.newsPost.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      publishedAt: true,
      updatedAt: true,
      author: {
        select: {
          name: true,
        },
      },
      coverAsset: {
        select: {
          path: true,
          bucket: true,
        },
      },
    },
  });

  if (!post) {
    return {
      title: "Noticia no encontrada | ALADIL",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    post.excerpt ||
    `Lee esta noticia de ALADIL: ${post.title}. Noticias y actualizaciones de la comunidad cientifica latinoamericana.`;

  return generateArticleMetadata({
    title: post.title,
    description,
    path: `/news/${slug}`,
    publishedTime: post.publishedAt || undefined,
    modifiedTime: post.updatedAt,
    author: post.author?.name || "ALADIL",
    section: "Noticias",
    tags: ["ALADIL", "noticias", "ciencia", "laboratorios"],
  });
}

export default async function NewsArticlePage({ params }: NewsPageProps) {
  const { slug } = await params;

  // Validate the news post exists and is published
  const post = await prisma.newsPost.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  return <NewsDetailPage slug={slug} />;
}
