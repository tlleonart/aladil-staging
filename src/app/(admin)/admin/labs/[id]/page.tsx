import { LabsEditPage } from "@/modules/labs/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLabPage({ params }: Props) {
  const { id } = await params;
  return <LabsEditPage id={id} />;
}
