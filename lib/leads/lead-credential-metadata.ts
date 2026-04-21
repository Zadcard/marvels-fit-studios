const LEAD_CREDENTIALS_PREFIX = "__join_credentials__:";

export function serializeLeadCredentialMetadata(clientId: string) {
  return `${LEAD_CREDENTIALS_PREFIX}${clientId}`;
}

export function readLeadCredentialClientId(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized?.startsWith(LEAD_CREDENTIALS_PREFIX)) {
    return null;
  }

  const clientId = normalized.slice(LEAD_CREDENTIALS_PREFIX.length);
  return /^\d{7}$/.test(clientId) ? clientId : null;
}

