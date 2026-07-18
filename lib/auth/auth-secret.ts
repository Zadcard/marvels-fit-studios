const LOCAL_DEVELOPMENT_AUTH_SECRET = "dev-only-auth-secret-change-me";

type AuthSecretEnvironment = Partial<Pick<
  NodeJS.ProcessEnv,
  "AUTH_SECRET" | "NEXTAUTH_SECRET" | "NODE_ENV" | "CI" | "VERCEL"
>>;

export function resolveAuthSecret(
  environment: AuthSecretEnvironment = process.env,
) {
  const configuredSecret =
    environment.AUTH_SECRET?.trim() || environment.NEXTAUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  const isExplicitLocalDevelopment =
    environment.NODE_ENV === "development" &&
    environment.CI !== "true" &&
    environment.VERCEL !== "1";

  return isExplicitLocalDevelopment
    ? LOCAL_DEVELOPMENT_AUTH_SECRET
    : undefined;
}

export function requireAuthSecret(
  environment: AuthSecretEnvironment = process.env,
) {
  const secret = resolveAuthSecret(environment);

  if (!secret) {
    throw new Error(
      "Missing AUTH_SECRET. Configure a unique secret outside local development.",
    );
  }

  return secret;
}
