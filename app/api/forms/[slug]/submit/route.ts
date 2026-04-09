import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { resend } from "@/lib/resend";
import { scoreLeadWithAI } from "@/lib/ai-scoring";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
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

    const scoring = await scoreLeadWithAI({
      serviceOffering: "Lead qualification and conversion services for service businesses",
      answers
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
      await supabase.from("lead_scores").upsert({
        workspace_id: form.workspace_id,
        lead_id: lead.id,
        score: scoring.score,
        temperature: scoring.temperature,
        urgency_level: scoring.urgency_level,
        recommended_next_action: scoring.recommended_next_action,
        summary: scoring.summary,
        source: scoring.source,
        fallback_reason: scoring.fallback_reason ?? null
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
          subject: `New lead for ${form.title} (${scoring.temperature.toUpperCase()} - ${scoring.score})`,
          text: `${fullName} submitted a lead.\nScore: ${scoring.score}\nUrgency: ${scoring.urgency_level}\nNext Action: ${scoring.recommended_next_action}`
        });
      }
    }

    return NextResponse.redirect(new URL(`/f/${slug}?success=1`, req.url));
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process lead submission",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
