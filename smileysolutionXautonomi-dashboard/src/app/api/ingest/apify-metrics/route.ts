import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function validateSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-apify-secret");
  const expected = process.env.APIFY_METRICS_SECRET;
  if (!expected) return false;
  return secret === expected;
}

// ─── Zod schemas (passthrough so unknown fields never crash the endpoint) ─────

const postItemSchema = z
  .object({
    id: z.string().optional(),
    shortCode: z.string().optional(),
    type: z.string().optional(),            // GraphImage | GraphVideo | GraphSidecar
    timestamp: z.union([z.string(), z.number()]).optional(),
    url: z.string().optional(),
    displayUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    likesCount: z.number().optional(),
    commentsCount: z.number().optional(),
    videoViewCount: z.number().optional(),
    caption: z.string().optional(),
  })
  .passthrough();

const profileItemSchema = z
  .object({
    id: z.string().optional(),
    username: z.string().optional(),
    followersCount: z.number().optional(),
    followingCount: z.number().optional(),
    postsCount: z.number().optional(),
    biography: z.string().optional(),
    profilePicUrl: z.string().optional(),
    // Different actors nest posts under different keys
    latestPosts:  z.array(postItemSchema).optional(),
    posts:        z.array(postItemSchema).optional(),
    recentPosts:  z.array(postItemSchema).optional(),
    topPosts:     z.array(postItemSchema).optional(),
  })
  .passthrough();

// Apify webhooks may send { items: [...] } or just an array at top level
const bodySchema = z
  .object({ items: z.array(profileItemSchema).optional() })
  .passthrough();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPostType(raw: string | undefined): "image" | "video_reel" | "carousel" | "story" {
  const t = (raw ?? "").toLowerCase();
  if (t.includes("video") || t.includes("reel")) return "video_reel";
  if (t.includes("sidecar") || t.includes("carousel") || t.includes("album")) return "carousel";
  if (t.includes("story")) return "story";
  return "image";
}

function parseTimestamp(raw: string | number | undefined): string | null {
  if (raw === undefined) return null;
  const d = typeof raw === "number" ? new Date(raw * 1000) : new Date(raw);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!validateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Always log raw payload so you can inspect the actor output on first call
  console.log("[apify-metrics] raw payload:", JSON.stringify(rawBody, null, 2));

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Schema parse error", issues: parsed.error.issues }, { status: 422 });
  }

  // Support { items: [...] } or raw array at top level
  const rawItems: unknown[] =
    parsed.data.items ??
    (Array.isArray(rawBody) ? rawBody : [rawBody]);

  const profiles = rawItems
    .map((item) => profileItemSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => (r as { success: true; data: z.infer<typeof profileItemSchema> }).data);

  if (profiles.length === 0) {
    return NextResponse.json({ error: "No parseable profile items found" }, { status: 422 });
  }

  const supabase = getServiceClient();
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID ?? "default";
  const today = todayString();

  let dailyUpserted = 0;
  let postsInserted = 0;
  let postsUpdated = 0;
  const skipped: string[] = [];

  for (const profile of profiles) {
    // ── 1. Derive posts array from whichever key the actor used ────────────
    const rawPosts =
      profile.latestPosts ??
      profile.posts ??
      profile.recentPosts ??
      profile.topPosts ??
      [];

    const followersCount = profile.followersCount ?? 0;

    // ── 2. Aggregate post interactions for reach proxy ──────────────────
    let totalLikes = 0;
    let totalComments = 0;
    for (const p of rawPosts) {
      totalLikes    += p.likesCount ?? 0;
      totalComments += p.commentsCount ?? 0;
    }
    const totalInteractions = totalLikes + totalComments;
    const totalReach = totalInteractions;
    const totalImpressions = totalReach * 3;
    const engagementRate =
      followersCount > 0 ? (totalInteractions / followersCount) * 100 : 0;

    // ── 3. Calculate followers_gained vs yesterday ──────────────────────
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: prevDay } = await supabase
      .from("daily_metrics")
      .select("followers_count")
      .eq("account_id", accountId)
      .eq("date", yesterdayStr)
      .maybeSingle();

    const followersGained = prevDay
      ? followersCount - (prevDay.followers_count ?? 0)
      : 0;

    // ── 4. Upsert daily_metrics ─────────────────────────────────────────
    const { error: dailyError } = await supabase.from("daily_metrics").upsert(
      {
        account_id:       accountId,
        date:             today,
        followers_count:  followersCount,
        followers_gained: followersGained,
        total_reach:      totalReach,
        total_impressions: totalImpressions,
        engagement_rate:  parseFloat(engagementRate.toFixed(4)),
        share_rate:       0,
        avg_saves:        0,
      },
      { onConflict: "account_id,date" }
    );

    if (dailyError) {
      console.error("[apify-metrics] daily_metrics upsert error:", dailyError.message);
    } else {
      dailyUpserted++;
    }

    // ── 5. Upsert each post ─────────────────────────────────────────────
    for (const post of rawPosts) {
      const postId = post.shortCode ?? post.id;
      if (!postId) {
        skipped.push("post missing id/shortCode");
        continue;
      }

      const publishedAt = parseTimestamp(post.timestamp);
      if (!publishedAt) {
        skipped.push(`${postId}: invalid timestamp`);
        continue;
      }

      const likes    = post.likesCount ?? 0;
      const comments = post.commentsCount ?? 0;
      const postEngagementRate =
        followersCount > 0 ? ((likes + comments) / followersCount) * 100 : 0;

      try {
        // Check if this post already exists
        const { data: existing } = await supabase
          .from("post_metrics")
          .select("id")
          .eq("instagram_post_id", postId)
          .maybeSingle();

        if (existing) {
          // Update engagement numbers in case they changed
          await supabase
            .from("post_metrics")
            .update({
              likes,
              comments,
              engagement_rate: parseFloat(postEngagementRate.toFixed(4)),
              updated_at: new Date().toISOString(),
            })
            .eq("instagram_post_id", postId);
          postsUpdated++;
        } else {
          await supabase.from("post_metrics").insert({
            instagram_post_id: postId,
            post_type:         mapPostType(post.type),
            published_at:      publishedAt,
            likes,
            comments,
            shares:            0,
            saves:             0,
            reach:             likes + comments,
            impressions:       (likes + comments) * 3,
            engagement_rate:   parseFloat(postEngagementRate.toFixed(4)),
            content_piece_id:  null,
          });
          postsInserted++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[apify-metrics] post ${postId} failed:`, msg);
        skipped.push(`${postId}: ${msg}`);
      }
    }
  }

  console.log(`[apify-metrics] done — daily: ${dailyUpserted}, posts inserted: ${postsInserted}, updated: ${postsUpdated}, skipped: ${skipped.length}`);

  return NextResponse.json({
    success: true,
    daily: dailyUpserted,
    posts: { inserted: postsInserted, updated: postsUpdated, skipped },
  });
}
