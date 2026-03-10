import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // No baseURL — Better Auth auto-detects window.location.origin in the browser.
  // This avoids CORS issues when the dev server runs on a different port.
});

export const { signIn, signUp, signOut, useSession } = authClient;
