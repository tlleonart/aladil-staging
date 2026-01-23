import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aladil.org";

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Generate consistent metadata for public pages
 */
export const generatePageMetadata = ({
  title,
  description,
  path,
  image = "/images/og-image.jpg",
  noIndex = false,
}: PageMetadataOptions): Metadata => {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ALADIL`,
      description,
      url,
      siteName: "ALADIL",
      locale: "es_LA",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ALADIL`,
      description,
      images: [image],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
};

/**
 * Generate metadata for article pages (news, meetings)
 */
export interface ArticleMetadataOptions {
  title: string;
  description: string;
  path: string;
  publishedTime?: Date;
  modifiedTime?: Date;
  author?: string;
  image?: string;
  section?: string;
  tags?: string[];
}

export const generateArticleMetadata = ({
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
  author = "ALADIL",
  image = "/images/og-image.jpg",
  section,
  tags,
}: ArticleMetadataOptions): Metadata => {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ALADIL`,
      description,
      url,
      siteName: "ALADIL",
      locale: "es_LA",
      type: "article",
      ...(publishedTime && { publishedTime: publishedTime.toISOString() }),
      ...(modifiedTime && { modifiedTime: modifiedTime.toISOString() }),
      authors: [author],
      ...(section && { section }),
      ...(tags && { tags }),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ALADIL`,
      description,
      images: [image],
    },
  };
};

/**
 * Site URL for use in components
 */
export const getSiteUrl = () => siteUrl;
