import { ExecutivePage } from "@/modules/public-site/pages/ExecutivePage";
import { generatePageMetadata } from "../metadata";

export const metadata = generatePageMetadata({
  title: "Comite Ejecutivo",
  description:
    "Conoce a los miembros del Comite Ejecutivo de ALADIL, lideres de instituciones de investigacion que guian la asociacion en su mision de colaboracion cientifica latinoamericana.",
  path: "/executive",
});

export default function Executive() {
  return <ExecutivePage />;
}
