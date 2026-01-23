import { ExecutiveEditPage } from "@/modules/executive/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExecutivePage({ params }: Props) {
  const { id } = await params;
  return <ExecutiveEditPage id={id} />;
}
