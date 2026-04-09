import Link from "next/link";
import { getCurrentMembership } from "@/lib/workspace";
import { createClient } from "@/lib/supabase-server";
import { BillingActions } from "@/components/billing-actions";
import { revalidatePath } from "next/cache";

async function createWorkspace() {
  "use server";
  const supabase = await createClient();
  const context = await getCurrentMembership();

  if (!context?.user || context.membership) return;

  const slug = `ws-${Math.random().toString(36).slice(2, 8)}`;
  const { data: workspace } = await supabase
    .from("workspaces")
    .insert({ name: "My Workspace", slug, owner_user_id: context.user.id })
    .select("id")
    .single();

  if (workspace?.id) {
    await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: context.user.id, role: "owner" });
  }

  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
  const context = await getCurrentMembership();
  const supabase = await createClient();

  const workspaceId = context?.membership?.workspace_id;

  if (!context?.membership) {
    return (
      <section className="card">
        <h1 className="text-2xl font-bold">Create your workspace</h1>
        <p className="mt-2 text-slate-600">A workspace isolates forms and leads for your account.</p>
        <form action={createWorkspace} className="mt-4">
          <button className="button-primary" type="submit">
            Create workspace
          </button>
        </form>
      </section>
    );
  }
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId ?? "");

  const { data: hotLeads } = await supabase
    .from("lead_scores")
    .select("score, leads(full_name, email)")
    .eq("workspace_id", workspaceId ?? "")
    .gte("score", 75)
    .limit(5);

  return (
    <section className="space-y-6">
      <div className="card">
        <p className="text-sm text-slate-500">Workspace</p>
        <h1 className="mt-1 text-2xl font-bold">{context?.membership?.workspaces?.name ?? "No workspace"}</h1>
        <p className="mt-3 text-slate-600">Total leads captured: {count ?? 0}</p>
        <Link className="button-primary mt-4" href="/dashboard/forms">
          Manage forms
        </Link>
      <BillingActions />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">High-scoring leads</h2>
        <ul className="mt-4 space-y-3">
          {(hotLeads ?? []).map((row, idx) => (
            <li key={idx} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">{row.leads?.full_name ?? "Unknown"}</p>
              <p className="text-slate-600">{row.leads?.email}</p>
              <p className="mt-1 text-brand">Score: {row.score}</p>
            </li>
          ))}
          {hotLeads?.length === 0 ? <li className="text-sm text-slate-500">No leads scored yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
