import OpenAI from "openai";
import { z } from "zod";

const leadScoreSchema = z.object({
  score: z.number().int().min(1).max(100),
  temperature: z.enum(["hot", "warm", "cold"]),
  summary: z.array(z.string().min(3).max(180)).length(3),
  urgency_level: z.enum(["high", "medium", "low"]),
  recommended_next_action: z.enum(["book_call", "send_quote", "ask_questions", "reject_politely"])
});

export type LeadScoreResult = z.infer<typeof leadScoreSchema> & {
  source: "ai" | "fallback";
  fallback_reason?: string;
};

function toBulletSummary(answers: Record<string, string>) {
  const items = Object.entries(answers)
    .filter(([, value]) => value?.trim())
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value.slice(0, 120)}`);

  while (items.length < 3) {
    items.push("Insufficient details provided by lead.");
  }

  return items;
}

export async function scoreLeadWithAI(input: {
  serviceOffering: string;
  answers: Record<string, string>;
}): Promise<LeadScoreResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      score: 35,
      temperature: "cold",
      summary: toBulletSummary(input.answers),
      urgency_level: "low",
      recommended_next_action: "ask_questions",
      source: "fallback",
      fallback_reason: "Missing OPENAI_API_KEY"
    };
  }

  const client = new OpenAI({ apiKey });

  const prompt = [
    "You are a strict B2B lead qualification engine.",
    "Return only JSON with keys: score, temperature, summary, urgency_level, recommended_next_action.",
    "Scoring criteria (equal weight): budget fit, timeline, project clarity, seriousness/intent, match with service offering.",
    "Rules:",
    "- score must be integer 1..100",
    "- temperature must be one of hot,warm,cold",
    "- summary must be exactly 3 concise bullet-style strings",
    "- urgency_level must be high,medium,low",
    "- recommended_next_action must be book_call,send_quote,ask_questions,reject_politely",
    `Service offering: ${input.serviceOffering}`,
    `Structured answers JSON: ${JSON.stringify(input.answers)}`
  ].join("\n");

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "lead_score",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              score: { type: "integer", minimum: 1, maximum: 100 },
              temperature: { type: "string", enum: ["hot", "warm", "cold"] },
              summary: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: { type: "string" }
              },
              urgency_level: { type: "string", enum: ["high", "medium", "low"] },
              recommended_next_action: {
                type: "string",
                enum: ["book_call", "send_quote", "ask_questions", "reject_politely"]
              }
            },
            required: ["score", "temperature", "summary", "urgency_level", "recommended_next_action"]
          }
        }
      }
    });

    const outputText = response.output_text;
    const parsedJson = JSON.parse(outputText);
    const parsed = leadScoreSchema.safeParse(parsedJson);

    if (!parsed.success) {
      return {
        score: 40,
        temperature: "cold",
        summary: toBulletSummary(input.answers),
        urgency_level: "low",
        recommended_next_action: "ask_questions",
        source: "fallback",
        fallback_reason: "OpenAI response failed schema validation"
      };
    }

    return { ...parsed.data, source: "ai" };
  } catch {
    return {
      score: 45,
      temperature: "cold",
      summary: toBulletSummary(input.answers),
      urgency_level: "low",
      recommended_next_action: "ask_questions",
      source: "fallback",
      fallback_reason: "OpenAI scoring request failed"
    };
  }
}
