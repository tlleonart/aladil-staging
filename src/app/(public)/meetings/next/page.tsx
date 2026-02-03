import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/modules/core/db";

export const metadata: Metadata = {
  title: "Próxima Reunión | ALADIL",
  description:
    "Información sobre la próxima reunión de ALADIL - Asociación Latinoamericana de Directores de Instituciones de Laboratorio.",
};

export default async function NextMeetingPage() {
  const today = new Date();

  // Find the next upcoming meeting (closest future date)
  const nextMeeting = await prisma.meeting.findFirst({
    where: {
      status: "PUBLISHED",
      startDate: { gte: today },
    },
    orderBy: { startDate: "asc" },
    select: { slug: true },
  });

  if (nextMeeting) {
    redirect(`/meetings/${nextMeeting.slug}`);
  }

  // If no future meeting, redirect to meetings list
  redirect("/meetings");
}
