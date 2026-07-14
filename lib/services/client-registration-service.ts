import bcryptjs from "bcryptjs";

import { clientIdGenerator } from "@/lib/services/client-id-generator";
import { passwordGenerator } from "@/lib/services/password-generator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BcryptPasswordVerifier } from "@/lib/auth/password-verifier";

export interface RegisterClientInput {
  fullName: string;
  phone: string;
  email?: string;
  groupId?: string;
}

export interface RegisterClientResult {
  userId: string;
  clientId: string;
  temporaryPassword: string;
}

export interface ResolvedClientGroup {
  id: string;
  name: string;
}

export interface ClientRegistrationStore {
  register(input: RegisterClientInput & { clientId: string; passwordHash: string }): Promise<{ userId: string; clientId: string }>;
  findClientByPhone(phone: string): Promise<{ id: string } | null>;
  findGroupByName(groupName: string): Promise<ResolvedClientGroup | null>;
}

const supabaseRegistrationStore: ClientRegistrationStore = {
  async register(input) {
    const { data, error } = await getSupabaseServerClient().rpc("register_client", {
      p_client_id: input.clientId,
      p_email: input.email ?? "",
      p_full_name: input.fullName,
      p_group_id: input.groupId ?? "",
      p_password_hash: input.passwordHash,
      p_phone: input.phone,
    });
    if (error) throw error;
    const result = data[0];
    if (!result) throw new Error("Client registration returned no record");
    return result;
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
  private passwordVerifier = new BcryptPasswordVerifier();

  async registerClient(
    input: RegisterClientInput
  ): Promise<RegisterClientResult> {
    const clientId = await clientIdGenerator.getNextAvailableId();
    const temporaryPassword = passwordGenerator.generatePassword(clientId);

    const hashedPassword = await bcryptjs.hash(temporaryPassword, 10);

    const result = await this.store.register({
      ...input,
      clientId,
      passwordHash: hashedPassword,
    });

    return {
      userId: result.userId,
      clientId: result.clientId,
      temporaryPassword,
    };
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
