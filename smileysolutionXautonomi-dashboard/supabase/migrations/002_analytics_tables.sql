-- Analytics Layer — Run after 001_initial_schema.sql
-- Supabase Dashboard → SQL Editor → New Query

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE post_type AS ENUM ('image', 'video_reel', 'carousel', 'story');

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE daily_metrics (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       text        NOT NULL DEFAULT 'default',
  date             date        NOT NULL,
  followers_count  integer     NOT NULL DEFAULT 0,
  followers_gained integer     NOT NULL DEFAULT 0,
  total_reach      integer     NOT NULL DEFAULT 0,
  total_impressions integer    NOT NULL DEFAULT 0,
  profile_views    integer     NOT NULL DEFAULT 0,
  website_clicks   integer     NOT NULL DEFAULT 0,
  engagement_rate  real        NOT NULL DEFAULT 0,  -- percentage e.g. 1.76
  share_rate       real        NOT NULL DEFAULT 0,  -- percentage e.g. 0.25
  avg_saves        real        NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, date)
);

CREATE TABLE post_metrics (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id   uuid        REFERENCES content_pieces(id) ON DELETE CASCADE,
  instagram_post_id  text,
  post_type          post_type   NOT NULL DEFAULT 'image',
  published_at       timestamptz NOT NULL,
  reach              integer     NOT NULL DEFAULT 0,
  impressions        integer     NOT NULL DEFAULT 0,
  likes              integer     NOT NULL DEFAULT 0,
  comments           integer     NOT NULL DEFAULT 0,
  shares             integer     NOT NULL DEFAULT 0,
  saves              integer     NOT NULL DEFAULT 0,
  engagement_rate    real        NOT NULL DEFAULT 0,  -- percentage
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_daily_metrics_account_date ON daily_metrics(account_id, date DESC);
CREATE INDEX idx_post_metrics_published   ON post_metrics(published_at DESC);
CREATE INDEX idx_post_metrics_type        ON post_metrics(post_type);
CREATE INDEX idx_post_metrics_piece       ON post_metrics(content_piece_id);

-- ─── Updated_at trigger (reuse existing function) ─────────────────────────────

CREATE TRIGGER post_metrics_updated_at
  BEFORE UPDATE ON post_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_metrics  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON daily_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON post_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Optional: seed sample data for development ───────────────────────────────
-- Remove the block below before running in production.

-- INSERT INTO daily_metrics (account_id, date, followers_count, followers_gained, total_reach, total_impressions, engagement_rate, share_rate, avg_saves)
-- VALUES
--   ('default', CURRENT_DATE - 6, 12400, 120, 8200, 14000, 1.82, 0.24, 3.1),
--   ('default', CURRENT_DATE - 5, 12520, 80,  7100, 12500, 1.60, 0.18, 2.7),
--   ('default', CURRENT_DATE - 4, 12600, 110, 9400, 16000, 2.10, 0.31, 4.0),
--   ('default', CURRENT_DATE - 3, 12710, 95,  8800, 15200, 1.95, 0.27, 3.5),
--   ('default', CURRENT_DATE - 2, 12805, 130, 11000, 18000, 2.40, 0.35, 4.8),
--   ('default', CURRENT_DATE - 1, 12935, 75,  7600, 13000, 1.70, 0.22, 3.0),
--   ('default', CURRENT_DATE,     13010, 90,  8900, 15500, 1.90, 0.28, 3.6);
