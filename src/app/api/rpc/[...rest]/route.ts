import { RPCHandler } from "@orpc/server/fetch";
import { createContext } from "@/modules/core/orpc/context";
import { appRouter } from "@/modules/core/orpc/router";

const handler = new RPCHandler(appRouter);

async function handleRequest(request: Request) {
  const context = await createContext();

  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context,
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
