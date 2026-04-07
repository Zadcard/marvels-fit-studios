import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";
import {
  getAuthorizationPolicy,
  getDashboardHomeForUserRole,
  isAuthorizedForArea,
} from "@/lib/auth/authorization-policy";

const { auth } = NextAuth(authConfig);

const proxyFunc = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const policy = getAuthorizationPolicy(nextUrl.pathname);

  if (policy.area === "api-auth" || policy.area === "login") {
    return NextResponse.next();
  }

  if (policy.requiresAuth && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (!isAuthorizedForArea(nextUrl.pathname, userRole)) {
    const redirectTarget = userRole
      ? getDashboardHomeForUserRole(userRole)
      : "/login";

    return NextResponse.redirect(new URL(redirectTarget, nextUrl));
  }

  return NextResponse.next();
});

export { proxyFunc as middleware };

// Match all routes except static ones
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|img|.*\\.js|.*\\.css).*)"],
};
