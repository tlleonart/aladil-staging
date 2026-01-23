"use client";

import dynamic from "next/dynamic";
import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "../components/ContactForm";

// Dynamic import to avoid SSR issues with Leaflet
const ContactMap = dynamic(
  () => import("../components/ContactMap").then((mod) => mod.ContactMap),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    ),
  },
);

interface ContactInfoItemProps {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

const ContactInfoItem = ({ icon, title, content }: ContactInfoItemProps) => (
  <div className="flex items-start gap-4">
    <div className="p-3 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <div className="text-gray-600 mt-1">{content}</div>
    </div>
  </div>
);

export const ContactPage = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Contacto
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Estamos aqui para responder tus consultas y conectarte con la
              comunidad cientifica latinoamericana
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Column - Contact Form */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Envianos un mensaje
              </h2>
              <p className="text-gray-600 mb-8">
                Completa el formulario y te responderemos a la brevedad. Estamos
                disponibles para consultas sobre membresias, colaboraciones y
                cualquier informacion que necesites.
              </p>
              <Card>
                <CardContent className="pt-6">
                  <ContactForm />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Contact Info & Map */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  Informacion de contacto
                </h2>
                <div className="space-y-6">
                  <ContactInfoItem
                    icon={<Mail className="h-5 w-5" />}
                    title="Correo electronico"
                    content={
                      <a
                        href="mailto:info@aladil.org"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        info@aladil.org
                      </a>
                    }
                  />
                  <ContactInfoItem
                    icon={<Phone className="h-5 w-5" />}
                    title="Telefono"
                    content={
                      <a
                        href="tel:+56912345678"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        +56 9 1234 5678
                      </a>
                    }
                  />
                  <ContactInfoItem
                    icon={<MapPin className="h-5 w-5" />}
                    title="Direccion"
                    content={
                      <div>
                        <p>Secretaria ALADIL</p>
                        <p>Santiago, Chile</p>
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ubicacion</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactMap />
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Horario de atencion
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Lunes a Viernes: 9:00 - 18:00 hrs (GMT-3)
                  </p>
                  <p className="text-blue-700 text-sm mt-2">
                    Respondemos consultas en un plazo de 24-48 horas habiles.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Conecta con la comunidad ALADIL
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Si representas a un laboratorio de investigacion en America Latina y
            deseas formar parte de nuestra red, no dudes en contactarnos.
            Estaremos encantados de darte la bienvenida.
          </p>
        </div>
      </section>
    </div>
  );
};
