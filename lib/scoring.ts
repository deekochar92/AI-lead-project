import { z } from "zod";

const leadInput = z.object({
  budget: z.string().optional(),
  timeline: z.string().optional(),
  description: z.string().optional()
});

export function scoreLead(payload: unknown) {
  const parsed = leadInput.safeParse(payload);
  if (!parsed.success) {
    return { score: 20, reason: "Insufficient structured data" };
  }

  const { budget, timeline, description } = parsed.data;
  let score = 35;

  if (budget && /(10k|20k|50k|100k)/i.test(budget)) score += 25;
  if (timeline && /(asap|month|2 weeks)/i.test(timeline)) score += 20;
  if (description && description.length > 80) score += 20;

  return {
    score: Math.min(score, 100),
    reason: score > 75 ? "High-intent profile based on urgency and budget" : "Moderate intent"
  };
}
