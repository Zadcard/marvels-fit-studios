import "server-only";

import type { Insert } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const landingLeadStore = {
  async listPendingCredentialMessages() {
    const { data, error } = await getSupabaseServerClient()
      .from("Lead")
      .select("message")
      .in("status", ["NEW", "CONTACTED"])
      .like("message", "__join_credentials__:%");
    if (error) throw error;
    return data;
  },
  async phoneExists(phone: string) {
    const supabase = getSupabaseServerClient();
    const [client, lead] = await Promise.all([
      supabase.from("Client").select("id").eq("phone", phone).maybeSingle(),
      supabase.from("Lead").select("id").eq("phone", phone).in("status", ["NEW", "CONTACTED"]).limit(1).maybeSingle(),
    ]);
    if (client.error) throw client.error;
    if (lead.error) throw lead.error;
    return { client: Boolean(client.data), lead: Boolean(lead.data) };
  },
  async create(input: Insert<"Lead">) {
    const { error } = await getSupabaseServerClient().from("Lead").insert(input);
    if (error) throw error;
  },
};
