import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import { generateArticleMetadata } from "@/app/(public)/metadata";
import { createAnonymousConvexClient } from "@/modules/core/convex/server";
import { MeetingDetailPage } from "@/modules/public-site/pages/MeetingDetailPage";

export const dynamic = "force-dynamic";

interface MeetingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MeetingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const convex = createAnonymousConvexClient();
  try {
    const meeting = await convex.query(api.meetings.getBySlug, { slug });
    const description =
      meeting.summary ||
      `Reunion #${meeting.number} de ALADIL en ${meeting.city}, ${meeting.country}.`;
    return generateArticleMetadata({
      title: meeting.title,
      description,
      path: `/meetings/${slug}`,
      publishedTime: meeting.startDate ? new Date(meeting.startDate) : undefined,
      modifiedTime: new Date(meeting._creationTime),
      section: "Reuniones",
      tags: ["ALADIL", "reuniones", meeting.country, meeting.city],
    });
  } catch {
    return {
      title: "Reunion no encontrada | ALADIL",
      robots: { index: false, follow: false },
    };
  }
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { slug } = await params;
  const convex = createAnonymousConvexClient();
  try {
    const meeting = await convex.query(api.meetings.getBySlug, { slug });
    return <MeetingDetailPage meeting={meeting} />;
  } catch {
    notFound();
  }
}
