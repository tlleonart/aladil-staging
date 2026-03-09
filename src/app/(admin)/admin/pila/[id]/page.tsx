import { PilaReportEditPage } from "@/modules/pila/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPilaReportPage({ params }: Props) {
  const { id } = await params;
  return <PilaReportEditPage id={id} />;
}
