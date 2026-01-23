import { ContactPage } from "@/modules/public-site/pages/ContactPage";
import { generatePageMetadata } from "../metadata";

export const metadata = generatePageMetadata({
  title: "Contacto",
  description:
    "Contacta a ALADIL, la Asociacion Latinoamericana de Directores de Laboratorios de Investigacion. Estamos aqui para responder tus consultas sobre colaboracion cientifica.",
  path: "/contact",
});

export default function Contact() {
  return <ContactPage />;
}
