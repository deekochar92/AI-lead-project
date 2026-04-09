import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentMembership } from "@/lib/workspace";
import { getEnv } from "@/lib/env";

export async function POST() {
  const env = getEnv();
  const context = await getCurrentMembership();
  const workspace = context?.membership?.workspaces;

  if (!workspace?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: workspace.stripe_customer_id ?? undefined,
    line_items: [{ price: env.STRIPE_PRICE_SETUP, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?setup=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?setup=cancelled`,
    metadata: { workspace_id: workspace.id, payment_type: "setup" }
  });

  return NextResponse.json({ url: session.url });
}
