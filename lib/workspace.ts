import { createClient } from "@/lib/supabase-server";

export async function getCurrentMembership() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) return null;

  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name, stripe_customer_id, stripe_subscription_id)")
    .eq("user_id", auth.user.id)
    .limit(1)
    .single();

  return { user: auth.user, membership: data };
}
