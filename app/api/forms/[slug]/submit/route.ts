import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { scoreLead } from "@/lib/scoring";
import { resend } from "@/lib/resend";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const data = await req.formData();

  const { data: form } = await supabase
    .from("forms")
    .select("id, workspace_id, title")
    .eq("slug", slug)
    .single();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, label")
    .eq("form_id", form.id);

  const answers: Record<string, string> = {};
  for (const q of questions ?? []) {
    answers[q.label] = String(data.get(q.id) ?? "");
  }

  const fullName = answers["Full name"] ?? "Unknown";
  const email = answers["Email"] ?? "unknown@example.com";
  const scoring = scoreLead({
    budget: answers["Estimated budget"],
    timeline: answers["Desired timeline"],
    description: answers["What do you need help with?"]
  });

  const { data: lead } = await supabase
    .from("leads")
    .insert({
      workspace_id: form.workspace_id,
      form_id: form.id,
      full_name: fullName,
      email,
      payload: answers,
      status: "new"
    })
    .select("id")
    .single();

  if (lead) {
    await supabase.from("lead_scores").insert({
      workspace_id: form.workspace_id,
      lead_id: lead.id,
      score: scoring.score,
      reason: scoring.reason
    });

    const { data: members } = await supabase
      .from("workspace_members")
      .select("profiles(email)")
      .eq("workspace_id", form.workspace_id)
      .eq("role", "owner");

    const to = members?.map((m) => m.profiles?.email).filter(Boolean) as string[];

    if (to.length > 0) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to,
        subject: `New lead for ${form.title} (score ${scoring.score})`,
        text: `${fullName} submitted a lead. Score: ${scoring.score}. Reason: ${scoring.reason}.`
      });
    }
  }

  return NextResponse.redirect(new URL(`/f/${slug}?success=1`, req.url));
}
