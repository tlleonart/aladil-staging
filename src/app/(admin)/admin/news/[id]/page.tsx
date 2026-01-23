import { NewsEditPage } from "@/modules/news/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: Props) {
  const { id } = await params;
  return <NewsEditPage id={id} />;
}
