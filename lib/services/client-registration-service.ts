import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface RegisterClientInput {
  fullName: string;
  phone: string;
  email?: string;
  groupId?: string;
}

export interface RegisterClientResult {
  userId: string;
}

export interface ResolvedClientGroup {
  id: string;
  name: string;
}

export interface ClientRegistrationStore {
  register(input: RegisterClientInput): Promise<{ userId: string }>;
  findClientByPhone(phone: string): Promise<{ id: string } | null>;
  findGroupByName(groupName: string): Promise<ResolvedClientGroup | null>;
}

const supabaseRegistrationStore: ClientRegistrationStore = {
  async register(input) {
    const { data, error } = await getSupabaseServerClient().rpc("register_client", {
      p_email: input.email ?? "",
      p_full_name: input.fullName,
      p_group_id: input.groupId ?? "",
      p_phone: input.phone,
    });
    if (error) throw error;
    const result = data[0];
    if (!result) throw new Error("Client registration returned no record");
    return { userId: result.userId };
  },
  async findClientByPhone(phone) {
    const { data, error } = await getSupabaseServerClient()
      .from("Client").select("id").eq("phone", phone).maybeSingle();
    if (error) throw error;
    return data;
  },
  async findGroupByName(groupName) {
    const { data, error } = await getSupabaseServerClient()
      .from("Group").select("id,name").ilike("name", groupName.trim()).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
};

export class ClientRegistrationService {
  constructor(private readonly store: ClientRegistrationStore = supabaseRegistrationStore) {}

  async registerClient(
    input: RegisterClientInput
  ): Promise<RegisterClientResult> {
    return this.store.register(input);
  }

  async isPhoneAvailable(phone: string): Promise<boolean> {
    const existing = await this.store.findClientByPhone(phone);
    return !existing;
  }

  async findGroupByName(groupName: string): Promise<ResolvedClientGroup | null> {
    return this.store.findGroupByName(groupName);
  }
}

export const clientRegistrationService = new ClientRegistrationService();
