import { NewsPage } from "@/modules/public-site/pages/NewsPage";
import { generatePageMetadata } from "../metadata";

export const metadata = generatePageMetadata({
  title: "Noticias",
  description:
    "Ultimas noticias, eventos y avances de ALADIL y la comunidad cientifica latinoamericana de laboratorios de investigacion.",
  path: "/news",
});

export default function News() {
  return <NewsPage />;
}
