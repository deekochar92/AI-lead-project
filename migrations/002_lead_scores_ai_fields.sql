alter table public.lead_scores
  add column if not exists temperature text,
  add column if not exists urgency_level text,
  add column if not exists recommended_next_action text,
  add column if not exists summary jsonb,
  add column if not exists source text,
  add column if not exists fallback_reason text;

update public.lead_scores
set
  temperature = coalesce(temperature, 'warm'),
  urgency_level = coalesce(urgency_level, 'medium'),
  recommended_next_action = coalesce(recommended_next_action, 'ask_questions'),
  summary = coalesce(summary, '["Legacy score record", "No AI summary captured", "Run rescoring endpoint"]'::jsonb),
  source = coalesce(source, 'fallback');

alter table public.lead_scores
  alter column temperature set not null,
  alter column urgency_level set not null,
  alter column recommended_next_action set not null,
  alter column summary set not null,
  alter column source set not null;

alter table public.lead_scores
  add constraint lead_scores_temperature_check check (temperature in ('hot', 'warm', 'cold')),
  add constraint lead_scores_urgency_level_check check (urgency_level in ('high', 'medium', 'low')),
  add constraint lead_scores_recommended_next_action_check check (recommended_next_action in ('book_call', 'send_quote', 'ask_questions', 'reject_politely')),
  add constraint lead_scores_source_check check (source in ('ai', 'fallback'));
