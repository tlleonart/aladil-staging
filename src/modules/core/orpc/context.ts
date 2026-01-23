import { headers } from "next/headers";
import { auth } from "@/modules/core/auth/auth";

type SessionData = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface Context {
  session: SessionData | null;
  user: SessionData["user"] | null;
}

export async function createContext(): Promise<Context> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    session: session ?? null,
    user: session?.user ?? null,
  };
}
