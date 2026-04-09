import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getCurrentMembership } from "@/lib/workspace";

async function createForm() {
  "use server";
  const supabase = await createClient();
  const context = await getCurrentMembership();
  const workspaceId = context?.membership?.workspace_id;

  if (!workspaceId) return;

  const slug = `form-${Math.random().toString(36).slice(2, 8)}`;

  const { data } = await supabase
    .from("forms")
    .insert({ workspace_id: workspaceId, title: "New Intake Form", slug, theme_color: "#5B5BD6" })
    .select("id")
    .single();

  if (data?.id) {
    await supabase.from("questions").insert([
      { form_id: data.id, label: "Full name", field_type: "text", is_required: true, sort_order: 1 },
      { form_id: data.id, label: "Email", field_type: "email", is_required: true, sort_order: 2 },
      { form_id: data.id, label: "What do you need help with?", field_type: "textarea", is_required: true, sort_order: 3 },
      { form_id: data.id, label: "Estimated budget", field_type: "text", is_required: false, sort_order: 4 },
      { form_id: data.id, label: "Desired timeline", field_type: "text", is_required: false, sort_order: 5 }
    ]);
  }
}

export default async function FormsPage() {
  const supabase = await createClient();
  const context = await getCurrentMembership();

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title, slug, created_at")
    .eq("workspace_id", context?.membership?.workspace_id ?? "")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Forms</h1>
        <form action={createForm}>
          <button className="button-primary" type="submit">
            New form
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {(forms ?? []).map((form) => (
          <article key={form.id} className="card">
            <h2 className="font-semibold">{form.title}</h2>
            <p className="mt-1 text-sm text-slate-600">Public URL: /f/{form.slug}</p>
            <div className="mt-4 flex gap-3">
              <Link href={`/dashboard/forms/${form.id}/builder`} className="button-secondary">
                Edit questions
              </Link>
              <Link href={`/f/${form.slug}`} className="button-secondary">
                Preview hosted form
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
