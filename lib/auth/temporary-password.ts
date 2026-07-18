import "server-only";

import { randomBytes } from "node:crypto";

export function generateTemporaryPassword() {
  // The fixed prefix guarantees the password-policy character classes while
  // the random suffix supplies 120 bits of entropy and remains copy-friendly.
  return `Mfs9-${randomBytes(15).toString("base64url")}`;
}
