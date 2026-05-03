-- Content OS — Initial Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE content_status AS ENUM (
  'inbox', 'starred', 'draft', 'approved', 'produced', 'published', 'archived'
);

CREATE TYPE client_persona AS ENUM (
  'analytical_ceo', 'dreamer_founder', 'creative_director',
  'growth_hacker', 'lifestyle_visionary'
);

CREATE TYPE content_type AS ENUM ('feed', 'stories', 'both');

CREATE TYPE content_source AS ENUM ('scoutbot', 'telegram', 'apify', 'manual');

CREATE TYPE pipeline_event AS ENUM (
  'ingested', 'ai_processed', 'starred', 'approved',
  'rejected', 'produced', 'published', 'archived'
);

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE content_pieces (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  source_url        text,
  raw_excerpt       text,
  feed_copy_en      text,
  stories_script_he text,
  visual_direction  text,
  client_persona    client_persona,
  status            content_status NOT NULL DEFAULT 'inbox',
  content_type      content_type NOT NULL DEFAULT 'both',
  source            content_source NOT NULL DEFAULT 'manual',
  viral_signals     jsonb,
  media_assets      jsonb,
  tags              text[],
  scheduled_at      timestamptz,
  published_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE personas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          client_persona NOT NULL UNIQUE,
  name         text NOT NULL,
  tone_profile text NOT NULL,
  target_pain  text NOT NULL,
  example_hook text NOT NULL,
  color        text NOT NULL DEFAULT '#6B7280',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_pieces(id) ON DELETE CASCADE,
  event      pipeline_event NOT NULL,
  payload    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_content_status ON content_pieces(status);
CREATE INDEX idx_content_persona ON content_pieces(client_persona);
CREATE INDEX idx_content_created ON content_pieces(created_at DESC);
CREATE INDEX idx_pipeline_content ON pipeline_logs(content_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_pieces_updated_at
  BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (internal tool — all users are trusted)
CREATE POLICY "authenticated_all" ON content_pieces
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON personas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON pipeline_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Seed Personas ────────────────────────────────────────────────────────────

INSERT INTO personas (key, name, tone_profile, target_pain, example_hook, color) VALUES
(
  'analytical_ceo',
  'Analytical CEO',
  'Data-driven, ROI-focused, skeptical of hype. Wants proof, case studies, and quantifiable outcomes. Respects brevity and directness.',
  'Wasting budget on unproven strategies. Fear of missing critical market signals.',
  'The one metric that predicted 3 of our biggest client wins — and how we almost missed it.',
  '#60A5FA'
),
(
  'dreamer_founder',
  'Dreamer Founder',
  'Vision-led, purpose-driven, building something meaningful. Inspired by stories of impact, authenticity, and breakthrough thinking.',
  'Feeling isolated in the founder journey. Struggling to articulate their vision to others.',
  'I almost quit three times before we found the one thing that changed everything.',
  '#F472B6'
),
(
  'creative_director',
  'Creative Director',
  'Aesthetic-first, craft-obsessed, allergic to mediocrity. Wants beauty and function in equal measure. Inspired by design details others miss.',
  'Being forced to ship work they are not proud of. The tension between speed and quality.',
  'The 2px decision that increased conversions by 34% — and why most designers would have missed it.',
  '#A78BFA'
),
(
  'growth_hacker',
  'Growth Hacker',
  'Obsessed with distribution, frameworks, and repeatable systems. Loves tactics, templates, and things that can be copied immediately.',
  'Plateauing growth despite trying everything. Not knowing which lever to pull next.',
  'The exact content framework we use to generate 10x more qualified leads with 50% less effort.',
  '#34D399'
),
(
  'lifestyle_visionary',
  'Lifestyle Visionary',
  'Integrates work and life intentionally. Aspires to build freedom, not just revenue. Inspired by behind-the-scenes authenticity and location independence.',
  'Feeling trapped by the business they built. Wanting permission to live differently.',
  'Running a 7-figure studio from Chiang Mai — what 18 months of designing my life actually looks like.',
  '#FB923C'
);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime for live dashboard updates
-- (Run in Supabase Dashboard → Database → Replication → enable for content_pieces)
