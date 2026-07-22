/**
 * PostgreSQL RPC arguments can be nullable even when generated Supabase types
 * expose their scalar type as required. Keep the type workaround isolated and
 * send a real SQL NULL instead of an invalid empty date or UUID string.
 */
export function nullableRpcString(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized || (null as unknown as string);
}
