import { UserRole } from "@/lib/supabase/domain";

export type DashboardRole = "admin" | "coach" | "client";
export type RouteArea = DashboardRole | "login" | "api-auth" | "public";

export type AuthorizationPolicy = {
  area: RouteArea;
  requiresAuth: boolean;
  allowedRoles: readonly UserRole[];
  dashboardHref: string | null;
};

const dashboardRolePolicies: Record<DashboardRole, AuthorizationPolicy> = {
  admin: {
    area: "admin",
    requiresAuth: true,
    allowedRoles: [UserRole.ADMIN],
    dashboardHref: "/admin",
  },
  coach: {
    area: "coach",
    requiresAuth: true,
    allowedRoles: [UserRole.COACH],
    dashboardHref: "/coach",
  },
  client: {
    area: "client",
    requiresAuth: true,
    allowedRoles: [UserRole.CLIENT],
    dashboardHref: "/client",
  },
};

const routePolicies: Array<{
  matches: (pathname: string) => boolean;
  policy: AuthorizationPolicy;
}> = [
  {
    matches: (pathname) => pathname.startsWith("/api/auth"),
    policy: {
      area: "api-auth",
      requiresAuth: false,
      allowedRoles: [],
      dashboardHref: null,
    },
  },
  {
    matches: (pathname) => pathname === "/login",
    policy: {
      area: "login",
      requiresAuth: false,
      allowedRoles: [],
      dashboardHref: null,
    },
  },
  ...Object.entries(dashboardRolePolicies).map(([role, policy]) => ({
    matches: (pathname: string) => pathname === `/${role}` || pathname.startsWith(`/${role}/`),
    policy,
  })),
];

export function getAuthorizationPolicy(pathname: string): AuthorizationPolicy {
  return (
    routePolicies.find((entry) => entry.matches(pathname))?.policy ?? {
      area: "public",
      requiresAuth: false,
      allowedRoles: [],
      dashboardHref: null,
    }
  );
}

export function getDashboardPolicy(role: DashboardRole): AuthorizationPolicy {
  return dashboardRolePolicies[role];
}

export function getDashboardHomeForRole(role: DashboardRole): string {
  return dashboardRolePolicies[role].dashboardHref ?? "/";
}

export function getDashboardRoleForUserRole(
  userRole: UserRole
): DashboardRole {
  switch (userRole) {
    case UserRole.COACH:
      return "coach";
    case UserRole.CLIENT:
      return "client";
    default:
      return "admin";
  }
}

export function getDashboardHomeForUserRole(userRole: UserRole): string {
  if (userRole === UserRole.CLIENT) {
    return "/portal-unavailable";
  }
  return getDashboardHomeForRole(getDashboardRoleForUserRole(userRole));
}

export function isAuthorizedForArea(
  pathname: string,
  userRole?: UserRole
): boolean {
  const policy = getAuthorizationPolicy(pathname);

  if (!policy.requiresAuth) {
    return true;
  }

  if (!userRole) {
    return false;
  }

  return policy.allowedRoles.includes(userRole);
}
