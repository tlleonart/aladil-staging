import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/modules/core/db";

export const metadata: Metadata = {
  title: "Última Reunión | ALADIL",
  description:
    "Información sobre la última reunión realizada de ALADIL - Asociación Latinoamericana de Directores de Instituciones de Laboratorio.",
};

export default async function LastMeetingPage() {
  const today = new Date();

  // Find the most recent past meeting
  const lastMeeting = await prisma.meeting.findFirst({
    where: {
      status: "PUBLISHED",
      startDate: { lt: today },
    },
    orderBy: { startDate: "desc" },
    select: { slug: true },
  });

  if (lastMeeting) {
    redirect(`/meetings/${lastMeeting.slug}`);
  }

  // If no past meeting, redirect to meetings list
  redirect("/meetings");
}
