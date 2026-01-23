import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCountryFlag,
  getCountryName,
} from "@/modules/shared/utils/countryFlag";

interface ExecutiveCardProps {
  fullName: string;
  position: string;
  countryCode: string;
  labName?: string | null;
  photoUrl?: string | null;
}

export const ExecutiveCard = ({
  fullName,
  position,
  countryCode,
  labName,
  photoUrl,
}: ExecutiveCardProps) => {
  const flag = getCountryFlag(countryCode);
  const countryName = getCountryName(countryCode);

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          {/* Photo placeholder */}
          <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center mb-4 overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>

          {/* Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {fullName}
          </h3>

          {/* Position */}
          <p className="text-sm font-medium text-blue-600 mb-2">{position}</p>

          {/* Country with flag */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
            <span className="text-lg" role="img" aria-label={countryName}>
              {flag}
            </span>
            <span>{countryName}</span>
          </div>

          {/* Lab affiliation */}
          {labName && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{labName}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
