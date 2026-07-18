import "server-only";

import { requireUser, UnauthorizedError } from "@/lib/auth/session";

export async function getRouteUserOrNull() {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return null;
    }

    throw error;
  }
}
