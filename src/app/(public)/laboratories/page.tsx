import { LaboratoriesPage } from "@/modules/public-site/pages/LaboratoriesPage";
import { generatePageMetadata } from "../metadata";

// Force dynamic rendering to avoid SSR issues with Leaflet
export const dynamic = "force-dynamic";

export const metadata = generatePageMetadata({
  title: "Laboratorios Miembros",
  description:
    "Conoce a los laboratorios miembros de ALADIL. Nuestra red reune a prestigiosas instituciones de investigacion de toda America Latina con mapa interactivo de ubicaciones.",
  path: "/laboratories",
});

export default function Laboratories() {
  return <LaboratoriesPage />;
}
