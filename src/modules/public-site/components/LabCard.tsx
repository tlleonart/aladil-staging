import { Building2, ExternalLink, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Country code to flag emoji mapping
const countryCodeToFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Country code to country name mapping for common LATAM countries
const countryNames: Record<string, string> = {
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  DO: "Republica Dominicana",
  EC: "Ecuador",
  GT: "Guatemala",
  HN: "Honduras",
  MX: "Mexico",
  NI: "Nicaragua",
  PA: "Panama",
  PE: "Peru",
  PR: "Puerto Rico",
  PY: "Paraguay",
  SV: "El Salvador",
  UY: "Uruguay",
  VE: "Venezuela",
};

interface LabCardProps {
  name: string;
  countryCode: string;
  city?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}

export const LabCard = ({
  name,
  countryCode,
  city,
  websiteUrl,
  logoUrl,
}: LabCardProps) => {
  const flag = countryCodeToFlag(countryCode);
  const countryName = countryNames[countryCode.toUpperCase()] || countryCode;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200 group">
      <CardHeader className="pb-3">
        {/* Logo placeholder */}
        <div className="w-full h-24 mb-4 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo de ${name}`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Building2 className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <CardTitle className="text-lg leading-tight line-clamp-2">
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          {/* Country with flag */}
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {flag}
            </span>
            <span>{countryName}</span>
          </div>

          {/* City */}
          {city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{city}</span>
            </div>
          )}

          {/* Website link */}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors mt-3"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Visitar sitio web</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
