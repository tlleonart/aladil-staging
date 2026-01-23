import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aladil.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "ALADIL - Asociacion Latinoamericana de Directores de Instituciones de Laboratorio",
    template: "%s | ALADIL",
  },
  description:
    "ALADIL reune a directores de laboratorios de investigacion de America Latina, promoviendo la colaboracion cientifica, el intercambio de conocimientos y el desarrollo regional desde 2004.",
  keywords: [
    "ALADIL",
    "laboratorios",
    "investigacion",
    "America Latina",
    "ciencia",
    "directores",
    "instituciones",
    "colaboracion cientifica",
  ],
  authors: [{ name: "ALADIL" }],
  creator: "ALADIL",
  publisher: "ALADIL",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_LA",
    url: siteUrl,
    siteName: "ALADIL",
    title:
      "ALADIL - Asociacion Latinoamericana de Directores de Instituciones de Laboratorio",
    description:
      "ALADIL reune a directores de laboratorios de investigacion de America Latina, promoviendo la colaboracion cientifica, el intercambio de conocimientos y el desarrollo regional desde 2004.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ALADIL - Asociacion Latinoamericana de Directores de Instituciones de Laboratorio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "ALADIL - Asociacion Latinoamericana de Directores de Instituciones de Laboratorio",
    description:
      "ALADIL reune a directores de laboratorios de investigacion de America Latina, promoviendo la colaboracion cientifica y el desarrollo regional.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
