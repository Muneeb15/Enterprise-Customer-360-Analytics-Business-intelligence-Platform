import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/overview(.*)",
  "/customers(.*)",
  "/sales(.*)",
  "/marketing(.*)",
  "/reports(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth enforcement if Clerk keys are not configured (local dev without Clerk)
  const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_");
  if (!hasClerkKey) return;

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
