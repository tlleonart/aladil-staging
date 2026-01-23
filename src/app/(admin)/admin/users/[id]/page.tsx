import { UsersEditPage } from "@/modules/users/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  return <UsersEditPage id={id} />;
}
