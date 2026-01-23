import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MeetingCardProps {
  number: number;
  title: string;
  slug: string;
  city: string;
  country: string;
  startDate: Date;
  endDate?: Date | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateRange = (startDate: Date, endDate?: Date | null): string => {
  const start = new Date(startDate);
  if (!endDate) {
    return formatDate(start);
  }

  const end = new Date(endDate);

  // Same month and year
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${start.getDate()} - ${end.getDate()} de ${new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(start)}`;
  }

  // Different months
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const MeetingCard = ({
  number,
  title,
  slug,
  city,
  country,
  startDate,
  endDate,
  status,
}: MeetingCardProps) => {
  return (
    <Link href={`/meetings/${slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <span className="text-xl font-bold">#{number}</span>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                  {title}
                </CardTitle>
              </div>
            </div>
            {status === "PUBLISHED" && (
              <Badge variant="secondary" className="flex-shrink-0">
                Publicada
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <CardDescription className="text-gray-600">
              {city}, {country}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <CardDescription className="text-gray-600">
              {formatDateRange(startDate, endDate)}
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
