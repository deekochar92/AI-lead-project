import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

async function addQuestion(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const formId = String(formData.get("form_id") ?? "");
  const label = String(formData.get("label") ?? "");

  if (!formId || !label) return;

  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("form_id", formId);

  await supabase.from("questions").insert({
    form_id: formId,
    label,
    field_type: "text",
    is_required: false,
    sort_order: (count ?? 0) + 1
  });

  revalidatePath(`/dashboard/forms/${formId}/builder`);
}

async function updateForm(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const formId = String(formData.get("form_id") ?? "");
  const title = String(formData.get("title") ?? "");
  const themeColor = String(formData.get("theme_color") ?? "#5B5BD6");

  await supabase.from("forms").update({ title, theme_color: themeColor }).eq("id", formId);
  revalidatePath(`/dashboard/forms/${formId}/builder`);
}

export default async function BuilderPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase.from("forms").select("id, title, slug, theme_color").eq("id", id).single();
  if (!form) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, label, field_type, is_required, sort_order")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Form builder</h1>
        <p className="text-sm text-slate-600">Hosted URL: /f/{form.slug}</p>
      </div>

      <form action={updateForm} className="card space-y-4">
        <input type="hidden" name="form_id" value={form.id} />
        <div>
          <label className="mb-1 block text-sm font-medium">Form title</label>
          <input className="input" name="title" defaultValue={form.title} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Brand color</label>
          <input className="input" name="theme_color" defaultValue={form.theme_color} />
        </div>
        <button className="button-primary" type="submit">
          Save details
        </button>
      </form>

      <div className="card">
        <h2 className="text-lg font-semibold">Questions</h2>
        <ul className="mt-4 space-y-2">
          {(questions ?? []).map((q) => (
            <li key={q.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">{q.label}</p>
              <p className="text-slate-500">
                {q.field_type} {q.is_required ? "· required" : "· optional"}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <form action={addQuestion} className="card space-y-4">
        <input type="hidden" name="form_id" value={form.id} />
        <div>
          <label className="mb-1 block text-sm font-medium">New question label</label>
          <input className="input" name="label" placeholder="What is your company website?" required />
        </div>
        <button className="button-primary" type="submit">
          Add question
        </button>
      </form>
    </section>
  );
}
