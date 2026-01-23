import { HomePage } from "@/modules/public-site/pages/HomePage";
import { generatePageMetadata } from "./metadata";

export const metadata = generatePageMetadata({
  title:
    "ALADIL - Asociacion Latinoamericana de Directores de Instituciones de Laboratorio",
  description:
    "ALADIL reune a directores de laboratorios de investigacion de America Latina, promoviendo la colaboracion cientifica, el intercambio de conocimientos y el desarrollo regional desde 2004.",
  path: "/",
});

export default function Page() {
  return <HomePage />;
}
