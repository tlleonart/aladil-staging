import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import { createAnonymousConvexClient } from "@/modules/core/convex/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Próxima Reunión | ALADIL",
  description:
    "Información sobre la próxima reunión de ALADIL - Asociación Latinoamericana de Directores de Instituciones de Laboratorio.",
};

export default async function NextMeetingPage() {
  const convex = createAnonymousConvexClient();
  const meetings = await convex.query(api.meetings.listPublished, {
    limit: 500,
  });
  const today = Date.now();
  const next = meetings
    .filter((m) => Date.parse(m.startDate) >= today)
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0];

  if (next) redirect(`/meetings/${next.slug}`);
  redirect("/meetings");
}
