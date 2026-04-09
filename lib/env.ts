const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_PRICE_MONTHLY",
  "STRIPE_PRICE_SETUP",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL"
] as const;

export function getEnv() {
  const env = Object.fromEntries(required.map((key) => [key, process.env[key]])) as Record<(typeof required)[number], string | undefined>;

  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  return env as Record<(typeof required)[number], string>;
}
