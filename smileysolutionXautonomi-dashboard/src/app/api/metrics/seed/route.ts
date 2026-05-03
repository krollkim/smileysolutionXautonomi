import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

function validateSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-seed-secret");
  const expected = process.env.METRICS_SEED_SECRET ?? process.env.APIFY_WEBHOOK_SECRET;
  if (!expected) return false;
  return secret === expected;
}

const dailyMetricSchema = z.object({
  account_id: z.string().default("default"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  followers_count: z.number().int().min(0),
  followers_gained: z.number().int().default(0),
  total_reach: z.number().int().min(0).default(0),
  total_impressions: z.number().int().min(0).default(0),
  profile_views: z.number().int().min(0).default(0),
  website_clicks: z.number().int().min(0).default(0),
  engagement_rate: z.number().min(0).default(0),
  share_rate: z.number().min(0).default(0),
  avg_saves: z.number().min(0).default(0),
});

const postMetricSchema = z.object({
  content_piece_id: z.string().uuid().optional(),
  instagram_post_id: z.string().optional(),
  post_type: z.enum(["image", "video_reel", "carousel", "story"]),
  published_at: z.string(),
  reach: z.number().int().min(0).default(0),
  impressions: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  shares: z.number().int().min(0).default(0),
  saves: z.number().int().min(0).default(0),
  engagement_rate: z.number().min(0).default(0),
});

const bodySchema = z.object({
  daily_metrics: z.array(dailyMetricSchema).optional(),
  post_metrics: z.array(postMetricSchema).optional(),
});

export async function POST(req: NextRequest) {
  if (!validateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 422 });
  }

  const supabase = getServiceClient();
  const results: Record<string, { inserted: number; errors: string[] }> = {
    daily_metrics: { inserted: 0, errors: [] },
    post_metrics: { inserted: 0, errors: [] },
  };

  if (parsed.data.daily_metrics && parsed.data.daily_metrics.length > 0) {
    for (const row of parsed.data.daily_metrics) {
      const { error } = await supabase
        .from("daily_metrics")
        .upsert(row, { onConflict: "account_id,date" });
      if (error) {
        results.daily_metrics.errors.push(error.message);
      } else {
        results.daily_metrics.inserted++;
      }
    }
  }

  if (parsed.data.post_metrics && parsed.data.post_metrics.length > 0) {
    for (const row of parsed.data.post_metrics) {
      const { error } = await supabase.from("post_metrics").insert(row);
      if (error) {
        results.post_metrics.errors.push(error.message);
      } else {
        results.post_metrics.inserted++;
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
