"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "./router";

const link = new RPCLink({
  url:
    typeof window !== "undefined"
      ? "/api/rpc"
      : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/rpc`,
  fetch: (input, init) => {
    return globalThis.fetch(input, {
      ...init,
      credentials: "include",
    });
  },
});

export const orpc: RouterClient<AppRouter> = createORPCClient(link);
