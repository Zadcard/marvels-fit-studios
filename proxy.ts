import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";
import {
  getAuthorizationPolicy,
  getDashboardHomeForUserRole,
  isAuthorizedForArea,
} from "@/lib/auth/authorization-policy";
import { parkedRouteRedirect } from "@/lib/launch-scope";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
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

  // Park out-of-scope surfaces for launch (client portal, notifications,
  // transformation). Data and code remain; the routes are simply unreachable.
  const roleHome = userRole ? getDashboardHomeForUserRole(userRole) : "/login";
  const parkedTarget = parkedRouteRedirect(nextUrl.pathname, roleHome);
  if (parkedTarget && parkedTarget !== nextUrl.pathname) {
    return NextResponse.redirect(new URL(parkedTarget, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|img|.*\\.js|.*\\.css).*)"],
};
