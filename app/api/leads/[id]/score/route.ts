import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { scoreLeadWithAI } from "@/lib/ai-scoring";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: lead } = await supabase
      .from("leads")
      .select("id, workspace_id, payload")
      .eq("id", id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const scoring = await scoreLeadWithAI({
      serviceOffering: "Lead qualification and conversion services for service businesses",
      answers: (lead.payload ?? {}) as Record<string, string>
    });

    const { error } = await supabase.from("lead_scores").upsert({
      workspace_id: lead.workspace_id,
      lead_id: lead.id,
      score: scoring.score,
      temperature: scoring.temperature,
      urgency_level: scoring.urgency_level,
      recommended_next_action: scoring.recommended_next_action,
      summary: scoring.summary,
      source: scoring.source,
      fallback_reason: scoring.fallback_reason ?? null
    });

    if (error) {
      return NextResponse.json({ error: "Unable to persist AI score", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scoring });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Scoring request failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
