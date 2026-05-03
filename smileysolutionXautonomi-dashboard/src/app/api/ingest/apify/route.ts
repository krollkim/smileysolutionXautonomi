import { NextRequest, NextResponse } from "next/server";
import { processContent } from "@/server/lib/processor";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

function validateWebhookSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-webhook-secret");
  return secret === process.env.APIFY_WEBHOOK_SECRET;
}

// Apify webhook payload shape (customize to match your Actor's output)
interface ApifyItem {
  title?: string;
  description?: string;
  text?: string;
  url?: string;
  articleUrl?: string;
  shares?: number;
  comments?: number;
  saves?: number;
  hashtags?: string[];
  thumbnailUrl?: string;
}

interface ApifyWebhookBody {
  eventType?: string;
  actorRunId?: string;
  resource?: {
    defaultDatasetId?: string;
  };
  // Direct dataset items (for simple webhook modes)
  items?: ApifyItem[];
}

export async function POST(req: NextRequest) {
  if (!validateWebhookSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ApifyWebhookBody;
  try {
    body = (await req.json()) as ApifyWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = body.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const supabase = getServiceClient();
  const results: Array<{ id: string; title: string }> = [];

  for (const item of items) {
    const title = item.title ?? "Untitled";
    const rawExcerpt = item.description ?? item.text ?? title;
    const sourceUrl = item.articleUrl ?? item.url;

    try {
      const processed = await processContent({
        title,
        rawExcerpt,
        sourceUrl,
        engagementData: {
          shares: item.shares,
          comments: item.comments,
          saves: item.saves,
          trendTags: item.hashtags,
        },
      });

      const mediaAssets = item.thumbnailUrl
        ? [{ url: item.thumbnailUrl, type: "image" as const, alt: title }]
        : undefined;

      const { data, error } = await supabase
        .from("content_pieces")
        .insert({
          title,
          source_url: sourceUrl ?? null,
          raw_excerpt: rawExcerpt,
          feed_copy_en: processed.feedCopyEn,
          stories_script_he: processed.storiesScriptHe,
          visual_direction: processed.visualDirection,
          client_persona: processed.clientPersona,
          status: "inbox",
          source: "apify",
          tags: processed.tags,
          viral_signals: processed.viralSignals,
          media_assets: mediaAssets ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("pipeline_logs").insert([
        { content_id: data.id, event: "ingested", payload: { source: "apify" } },
        { content_id: data.id, event: "ai_processed", payload: { model: "claude-sonnet-4-6" } },
      ]);

      results.push({ id: data.id, title });
    } catch (err) {
      console.error("[ingest/apify] Failed item:", title, err);
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, items: results });
}
