/**
 * Debug the Convex Auth Password sign-in flow end to end.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/migration/debug-login.ts <email> <password>
 *
 * Reports:
 *  - HTTP status / body of the POST to the Convex site /api/auth endpoint
 *  - The outcome of api.auth.signIn mutation (via ConvexHttpClient)
 *  - Any thrown error with full message and data
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: debug-login.ts <email> <password>");
  process.exit(1);
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

async function probeConvexMutation() {
  console.log("\n── via ConvexHttpClient: api.auth.signIn ──");
  const client = new ConvexHttpClient(CONVEX_URL);
  try {
    const res = await client.action(
      api.auth.signIn,
      {
        provider: "password",
        params: { email, password, flow: "signIn" },
      },
    );
    console.log("Result:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.log("FAILED");
    if (e instanceof Error) {
      console.log("name:", e.name);
      console.log("message:", e.message);
      console.log("stack:", e.stack);
      const data = (e as { data?: unknown }).data;
      if (data !== undefined) console.log("data:", JSON.stringify(data, null, 2));
    } else {
      console.log(e);
    }
  }
}

async function probeHttpRoute() {
  console.log("\n── via POST to /api/auth ──");
  const url = `${SITE_URL}/api/auth`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signIn",
        params: {
          provider: "password",
          params: { email, password, flow: "signIn" },
        },
      }),
    });
    console.log("status:", res.status, res.statusText);
    console.log(
      "response headers:",
      Object.fromEntries(res.headers.entries()),
    );
    const text = await res.text();
    console.log("body:\n", text.slice(0, 2000));
  } catch (e) {
    console.log("fetch error:", e instanceof Error ? e.message : e);
  }
}

async function lookUpUser() {
  console.log("\n── user lookup (api.users.me requires auth, skip) ──");
  console.log("email under test:", email);
}

(async () => {
  console.log("CONVEX_URL:", CONVEX_URL);
  console.log("SITE_URL  :", SITE_URL);
  await lookUpUser();
  await probeConvexMutation();
  await probeHttpRoute();
})();
