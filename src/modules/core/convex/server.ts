import "server-only";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

/**
 * Create an authenticated Convex HTTP client for the current request.
 * Reads the JWT from the Next.js auth cookies.
 */
export async function createConvexClient(): Promise<ConvexHttpClient> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  const client = new ConvexHttpClient(url);
  const token = await convexAuthNextjsToken();
  if (token) client.setAuth(token);
  return client;
}

/** Same but without tying to the request (anonymous). */
export function createAnonymousConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}
