import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip static files and _next assets
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    // Protect all API routes as well
    "/(api|trpc)(.*)",
  ],
}
