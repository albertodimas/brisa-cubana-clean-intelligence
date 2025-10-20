import { NextResponse, type NextRequest } from "next/server";

const normalizedNextAuthUrl =
  process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
const isProduction = process.env.NODE_ENV === "production";
const shouldUseSecureCookies =
  process.env.AUTH_COOKIE_SECURE === "true" ||
  (process.env.AUTH_COOKIE_SECURE !== "false" &&
    isProduction &&
    (process.env.VERCEL === "1" ||
      normalizedNextAuthUrl.startsWith("https://")));
const sessionCookieName = shouldUseSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.cookies.get(sessionCookieName)?.value);

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/checkout",
    "/clientes",
    "/api/auth",
    "/lhci",
    "/robots.txt",
    "/sitemap.xml",
  ];

  // Allow marketing/landing routes without sesión
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });

  // Redirect to login if not authenticated and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if logged in and trying to access login page
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (API routes - handled by Hono serverless functions)
     * - /api/auth/* (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt / sitemap.xml (SEO endpoints)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|lhci|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|txt|xml)$).*)",
  ],
};
