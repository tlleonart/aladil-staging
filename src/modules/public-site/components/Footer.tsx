import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  institution: [
    { name: "Quiénes Somos", href: "/#quienes-somos" },
    { name: "Socios", href: "/#socios" },
  ],
  meetings: [
    { name: "Próxima Reunión", href: "/meetings/next" },
    { name: "Última Reunión", href: "/meetings/last" },
    { name: "Reuniones Anteriores", href: "/meetings/past" },
  ],
  resources: [
    { name: "Noticias", href: "/news" },
    { name: "Contacto", href: "/#contacto" },
  ],
};

const socialLinks = [
  { name: "Facebook", href: "https://facebook.com", icon: Facebook },
  { name: "Twitter", href: "https://twitter.com", icon: Twitter },
  { name: "Instagram", href: "https://instagram.com", icon: Instagram },
  { name: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
];

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="ALADIL Logo"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
              <span className="text-xl font-bold">ALADIL</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Asociación Latinoamericana de Directores de Instituciones de
              Laboratorio
            </p>
            <div className="flex gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Institution Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Institución
            </h3>
            <ul className="space-y-2">
              {footerLinks.institution.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Meetings Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Reuniones
            </h3>
            <ul className="space-y-2">
              {footerLinks.meetings.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>contacto@aladil.org</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Latinoamérica</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} ALADIL. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
