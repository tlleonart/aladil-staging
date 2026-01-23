import { MeetingsEditPage } from "@/modules/meetings/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: Props) {
  const { id } = await params;
  return <MeetingsEditPage id={id} />;
}
