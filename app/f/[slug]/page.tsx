import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function PublicFormPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, title, slug, theme_color, workspace_id")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!form) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, label, field_type, is_required")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <section className="card">
        <h1 className="text-2xl font-bold" style={{ color: form.theme_color }}>
          {form.title}
        </h1>
        <form action={`/api/forms/${slug}/submit`} method="post" className="mt-6 space-y-4">
          {(questions ?? []).map((q) => (
            <div key={q.id}>
              <label className="mb-1 block text-sm font-medium">{q.label}</label>
              {q.field_type === "textarea" ? (
                <textarea className="input min-h-28" name={q.id} required={q.is_required} />
              ) : (
                <input className="input" type={q.field_type === "email" ? "email" : "text"} name={q.id} required={q.is_required} />
              )}
            </div>
          ))}
          <button className="button-primary w-full" type="submit">
            Submit inquiry
          </button>
        </form>
      </section>
    </main>
  );
}
