import { MeetingsPage } from "@/modules/public-site/pages/MeetingsPage";
import { generatePageMetadata } from "../metadata";

export const metadata = generatePageMetadata({
  title: "Reuniones",
  description:
    "Encuentros anuales de directores de laboratorios de investigacion de toda America Latina. Explora el historial de reuniones de ALADIL desde 2004.",
  path: "/meetings",
});

export default function Meetings() {
  return <MeetingsPage />;
}
