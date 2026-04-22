import type { MetadataRoute } from "next";
import { api } from "@/../convex/_generated/api";
import { createAnonymousConvexClient } from "@/modules/core/convex/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aladil.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/meetings`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/meetings/next`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/meetings/last`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/meetings/past`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/news`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];

  const convex = createAnonymousConvexClient();
  const [meetings, newsPosts] = await Promise.all([
    convex.query(api.meetings.listPublished, { limit: 500 }),
    convex.query(api.news.listPublished, { limit: 500 }),
  ]);

  const meetingPages: MetadataRoute.Sitemap = meetings.map((m) => ({
    url: `${siteUrl}/meetings/${m.slug}`,
    lastModified: new Date(m._creationTime),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const newsPages: MetadataRoute.Sitemap = newsPosts.map((p) => ({
    url: `${siteUrl}/news/${p.slug}`,
    lastModified: new Date(p._creationTime),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...meetingPages, ...newsPages];
}
