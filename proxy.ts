import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

// We define UserRole locally or as a string to avoid importing from @prisma/client in the Proxy
type UserRole = "ADMIN" | "COACH" | "CLIENT";

const { auth } = NextAuth(authConfig);

const proxyFunc = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role as UserRole | undefined;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAuthRoute = nextUrl.pathname === "/login";

  // 1. Allow API Auth routes always
  if (isApiAuthRoute) return NextResponse.next();

  // 2. Always allow the login page so users can choose which account to enter.
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // 3. Protect dashboard routes
  const isDashboardRoute =
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/coach") ||
    nextUrl.pathname.startsWith("/client");

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Role-based protection: check if the user is in the correct area
    const parts = nextUrl.pathname.split("/");
    const pathRole = parts[1].toUpperCase() as UserRole;

    if (userRole && userRole !== pathRole) {
      // User is in the wrong portal, redirect them to THEIR portal
      return NextResponse.redirect(
        new URL(`/${userRole.toLowerCase()}`, nextUrl)
      );
    }
  }

  return NextResponse.next();
});

// Rename export to 'proxy' for Next.js 16 requirements
export { proxyFunc as proxy };

// Match all routes except static ones
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|img|.*\\.js|.*\\.css).*)"],
};
