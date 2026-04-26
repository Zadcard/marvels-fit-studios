import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

export type ParsedCredentials = z.infer<typeof credentialsSchema>;

export function parseCredentials(
  credentials: unknown
): ParsedCredentials | null {
  const parsedCredentials = credentialsSchema.safeParse(credentials);
  return parsedCredentials.success ? parsedCredentials.data : null;
}
