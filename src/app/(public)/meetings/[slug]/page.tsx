import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateArticleMetadata } from "@/app/(public)/metadata";
import { prisma } from "@/modules/core/db";
import { MeetingDetailPage } from "@/modules/public-site/pages/MeetingDetailPage";

interface MeetingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: MeetingPageProps): Promise<Metadata> {
  const { slug } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { slug },
    select: {
      title: true,
      city: true,
      country: true,
      summary: true,
      number: true,
      startDate: true,
      updatedAt: true,
      coverAsset: {
        select: {
          path: true,
          bucket: true,
        },
      },
    },
  });

  if (!meeting) {
    return {
      title: "Reunion no encontrada | ALADIL",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    meeting.summary ||
    `Reunion #${meeting.number} de ALADIL en ${meeting.city}, ${meeting.country}. Encuentro anual de directores de laboratorios de investigacion de America Latina.`;

  return generateArticleMetadata({
    title: meeting.title,
    description,
    path: `/meetings/${slug}`,
    publishedTime: meeting.startDate,
    modifiedTime: meeting.updatedAt,
    section: "Reuniones",
    tags: ["ALADIL", "reuniones", meeting.country, meeting.city],
  });
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { slug } = await params;

  // Fetch the full meeting data
  const meeting = await prisma.meeting.findUnique({
    where: { slug },
    include: {
      coverAsset: true,
      hostLab: { select: { id: true, name: true } },
      topicsPdfAsset: true,
      gallery: { include: { asset: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!meeting || meeting.status !== "PUBLISHED") {
    notFound();
  }

  return <MeetingDetailPage meeting={meeting} />;
}
