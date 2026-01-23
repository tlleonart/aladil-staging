import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NewsCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  coverUrl?: string | null;
  authorName?: string | null;
}

const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

export const NewsCard = ({
  title,
  slug,
  excerpt,
  publishedAt,
  coverUrl,
  authorName,
}: NewsCardProps) => {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
      {/* Cover Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-blue-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        {publishedAt && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Calendar className="h-4 w-4" />
            <time dateTime={new Date(publishedAt).toISOString()}>
              {formatDate(publishedAt)}
            </time>
          </div>
        )}
        <CardTitle className="text-xl line-clamp-2">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        {excerpt && (
          <CardDescription className="text-gray-600 line-clamp-3">
            {excerpt}
          </CardDescription>
        )}
        {authorName && (
          <p className="text-sm text-gray-500 mt-3">Por {authorName}</p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Link
          href={`/news/${slug}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Leer mas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};
