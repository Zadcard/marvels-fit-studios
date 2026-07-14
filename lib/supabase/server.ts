import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

let serverClient: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseServerClient() {
  if (!serverClient) {
    const { url } = getPublicSupabaseConfig();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      throw new Error(
        "Missing required server environment variable: SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    serverClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return serverClient;
}

