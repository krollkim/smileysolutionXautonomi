import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processContent } from "@/server/lib/processor";
import { createClient } from "@/lib/supabase/server";

const manualIngestSchema = z.object({
  title: z.string().min(1).max(300),
  rawExcerpt: z.string().min(10),
  sourceUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = manualIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { title, rawExcerpt, sourceUrl } = parsed.data;

  try {
    const processed = await processContent({ title, rawExcerpt, sourceUrl });

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
        source: "manual",
        tags: processed.tags,
        viral_signals: processed.viralSignals,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("pipeline_logs").insert([
      { content_id: data.id, event: "ingested", payload: { source: "manual" } },
      { content_id: data.id, event: "ai_processed", payload: { model: "claude-sonnet-4-6" } },
    ]);

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ingest/manual]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
