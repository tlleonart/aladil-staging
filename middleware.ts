import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/login", "/sign-in"]);
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/profile(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated();
  if (isSignInPage(request) && authed) {
    return nextjsMiddlewareRedirect(request, "/admin");
  }
  if (isProtectedRoute(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  // Run middleware on all routes except static assets & Next internals
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
