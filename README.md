# LeadPilot SaaS MVP

Production-ready SaaS MVP for AI lead qualification built with **Next.js + TypeScript + Tailwind + Supabase + Stripe + Resend**.

## Features

- Supabase passwordless authentication
- Multi-tenant workspace model
- Marketing landing page with pricing + CTA
- Authenticated dashboard with high-score lead list
- Form builder with editable form metadata and dynamic questions
- Hosted public form (`/f/[slug]`) for inbound leads
- AI lead scoring via OpenAI (deterministic JSON output + validation fallback)
- Stripe subscription + one-time setup checkout endpoints
- Stripe webhook sync to workspace billing fields
- Resend email notifications for new scored leads
- Vercel-ready project layout and environment setup

## Folder structure

```txt
app/
  (marketing)/page.tsx         # Landing page + pricing
  (auth)/login/page.tsx        # Magic-link login
  dashboard/
    page.tsx                   # Workspace overview + billing CTAs
    forms/page.tsx             # Forms listing + create form
    forms/[id]/builder/page.tsx# Edit form metadata + add questions
  f/[slug]/page.tsx            # Public hosted lead capture form
  api/forms/[slug]/submit      # Lead submission + AI score + email
  api/leads/[id]/score          # Server-side rescoring endpoint
  api/stripe/checkout          # Subscription checkout session
  api/stripe/setup             # One-time setup checkout session
  api/stripe/webhook           # Stripe webhook sync
lib/
  supabase-*.ts                # Supabase clients (browser/server/admin)
  stripe.ts                    # Stripe client
  resend.ts                    # Resend client
  ai-scoring.ts                # OpenAI scoring + schema fallback
  scoring.ts                   # legacy heuristic scorer
  workspace.ts                 # Workspace auth context helper
migrations/
  001_init.sql                 # Multi-tenant schema + RLS
```

## Database schema

Apply `migrations/001_init.sql` in Supabase SQL editor.

Tables:
- `profiles`
- `workspaces`
- `workspace_members`
- `forms`
- `questions`
- `leads`
- `lead_scores` (score, temperature, urgency, summary bullets, recommended action, source/fallback fields)

## Setup instructions

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create env file**
   ```bash
   cp .env.example .env.local
   ```
3. **Configure Supabase**
   - Create project
   - Run SQL from `migrations/001_init.sql`
   - Add keys to `.env.local`
4. **Configure Stripe**
   - Create 2 prices:
     - recurring monthly
     - one-time setup
   - Set `STRIPE_PRICE_MONTHLY` + `STRIPE_PRICE_SETUP`
   - Forward webhook locally:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
5. **Configure Resend**
   - Add `RESEND_API_KEY`
   - Verify sender and set `RESEND_FROM_EMAIL`
6. **Configure OpenAI**
   - Set `OPENAI_API_KEY`
   - Optional: set `OPENAI_MODEL` (defaults to `gpt-4.1-mini`)
7. **Run app**
   ```bash
   npm run dev
   ```

## Suggested production deployment (Vercel)

1. Push repo to GitHub.
2. Import in Vercel.
3. Add environment variables from `.env.example`.
4. Configure Stripe webhook URL to:
   `https://YOUR_DOMAIN/api/stripe/webhook`
5. Deploy.

## Notes

- Keep Supabase service role key **server-side only**.
- Public lead submissions are intentionally open insert on `leads`/`lead_scores` for hosted forms. Restrict further with captcha/rate limiting in production.
- This MVP intentionally excludes CRM, chat, mobile app, and advanced analytics.
