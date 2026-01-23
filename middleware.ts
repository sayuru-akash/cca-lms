import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const isPublicRoute = pathname.startsWith("/auth/");

  // Check for NextAuth session token in cookies
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // Root path - redirect to login or dashboard based on auth status
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Protected routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/programmes") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile");

  // Redirect to login if trying to access protected route while not authenticated
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url),
    );
  }

  // Redirect to dashboard if trying to access auth pages while already logged in
  if (isPublicRoute && isLoggedIn && pathname !== "/auth/first-login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
