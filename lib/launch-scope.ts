// Central definition of what is in scope for Marvel's first launch.
//
// The first launch supports ADMIN and COACH only. Several previously built
// subsystems are intentionally OUT OF SCOPE. They are *parked*, not deleted:
// all tables, data, server code, and UI components remain in the repository so
// they can be re-enabled later by flipping the flags below. Parking means the
// surfaces are hidden from navigation and unreachable by URL.
//
//   - Client portal (self-service client dashboard)
//   - Notifications (in-app notification centre + reminders)
//   - Transformation studio (assessments, goals, training programs)

export const LAUNCH_CLIENT_PORTAL_ENABLED = false;
export const LAUNCH_NOTIFICATIONS_ENABLED = false;
export const LAUNCH_TRANSFORMATION_ENABLED = false;

// A logged-in client landing page for when the client portal is parked. It
// lives outside the /client route group so redirecting to it never loops.
export const PORTAL_UNAVAILABLE_PATH = "/portal-unavailable";

const NOTIFICATIONS_PATTERN = /\/notifications(?:\/|$)/;
const TRANSFORMATION_PATTERN = /\/transformation(?:\/|$)/;

function isClientPortalRoute(pathname: string): boolean {
  return pathname === "/client" || pathname.startsWith("/client/");
}

/**
 * Returns the path a parked route should redirect to, or null when the route is
 * in scope. `roleHome` is the caller's own dashboard home, used for parked
 * admin/coach sub-routes so the user lands somewhere useful.
 *
 * Client-portal routes are checked first so client notification routes resolve
 * to the portal-unavailable page rather than an admin/coach home.
 */
export function parkedRouteRedirect(
  pathname: string,
  roleHome: string
): string | null {
  if (!LAUNCH_CLIENT_PORTAL_ENABLED && isClientPortalRoute(pathname)) {
    return PORTAL_UNAVAILABLE_PATH;
  }

  if (!LAUNCH_NOTIFICATIONS_ENABLED && NOTIFICATIONS_PATTERN.test(pathname)) {
    return roleHome;
  }

  if (!LAUNCH_TRANSFORMATION_ENABLED && TRANSFORMATION_PATTERN.test(pathname)) {
    return roleHome;
  }

  return null;
}
