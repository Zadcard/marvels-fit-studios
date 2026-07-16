import { describe, expect, it } from "vitest";

import {
  LAUNCH_CLIENT_PORTAL_ENABLED,
  LAUNCH_NOTIFICATIONS_ENABLED,
  LAUNCH_TRANSFORMATION_ENABLED,
  PORTAL_UNAVAILABLE_PATH,
  parkedRouteRedirect,
} from "@/lib/launch-scope";

describe("launch scope", () => {
  it("keeps admin and coach out-of-scope areas parked for launch", () => {
    expect(LAUNCH_CLIENT_PORTAL_ENABLED).toBe(false);
    expect(LAUNCH_NOTIFICATIONS_ENABLED).toBe(false);
    expect(LAUNCH_TRANSFORMATION_ENABLED).toBe(false);
  });

  it("sends any client portal route to the portal-unavailable page", () => {
    expect(parkedRouteRedirect("/client", "/admin")).toBe(PORTAL_UNAVAILABLE_PATH);
    expect(parkedRouteRedirect("/client/sessions", "/admin")).toBe(
      PORTAL_UNAVAILABLE_PATH
    );
    // client notification route resolves as a client route, not to a role home
    expect(parkedRouteRedirect("/client/notifications", "/admin")).toBe(
      PORTAL_UNAVAILABLE_PATH
    );
  });

  it("sends parked notification and transformation routes to the role home", () => {
    expect(parkedRouteRedirect("/admin/notifications", "/admin")).toBe("/admin");
    expect(parkedRouteRedirect("/coach/notifications", "/coach")).toBe("/coach");
    expect(
      parkedRouteRedirect("/coach/clients/abc/transformation", "/coach")
    ).toBe("/coach");
  });

  it("leaves in-scope routes untouched", () => {
    for (const pathname of [
      "/admin",
      "/admin/clients",
      "/admin/schedule",
      "/coach",
      "/coach/clients",
      "/coach/schedule",
    ]) {
      expect(parkedRouteRedirect(pathname, "/admin")).toBeNull();
    }
  });
});
