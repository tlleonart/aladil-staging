import { AboutPage } from "@/modules/public-site/pages/AboutPage";
import { generatePageMetadata } from "../metadata";

export const metadata = generatePageMetadata({
  title: "Quienes Somos",
  description:
    "Conoce a ALADIL, la Asociacion Latinoamericana de Directores de Laboratorios de Investigacion. Fundada en 2004 en Vina del Mar, Chile, promovemos la colaboracion cientifica en la region.",
  path: "/about",
});

export default function About() {
  return <AboutPage />;
}
