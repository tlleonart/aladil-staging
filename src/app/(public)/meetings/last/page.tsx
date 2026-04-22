import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import { createAnonymousConvexClient } from "@/modules/core/convex/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Última Reunión | ALADIL",
  description:
    "Información sobre la última reunión realizada de ALADIL - Asociación Latinoamericana de Directores de Instituciones de Laboratorio.",
};

export default async function LastMeetingPage() {
  const convex = createAnonymousConvexClient();
  const meetings = await convex.query(api.meetings.listPublished, {
    limit: 500,
  });
  const today = Date.now();
  const last = meetings
    .filter((m) => Date.parse(m.startDate) < today)
    .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate))[0];
  if (last) redirect(`/meetings/${last.slug}`);
  redirect("/meetings");
}
