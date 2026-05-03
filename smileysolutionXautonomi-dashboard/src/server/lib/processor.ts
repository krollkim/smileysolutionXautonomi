import Anthropic from "@anthropic-ai/sdk";
import type { ViralSignals, ClientPersona } from "@/types/content";

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

// ─── Input / Output Types ─────────────────────────────────────────────────────

export interface RawProcessInput {
  title: string;
  rawExcerpt: string;
  sourceUrl?: string;
  engagementData?: {
    shares?: number;
    comments?: number;
    saves?: number;
    trendTags?: string[];
  };
}

export interface ProcessOutput {
  feedCopyEn: string;
  storiesScriptHe: string;
  visualDirection: string;
  clientPersona: ClientPersona;
  tags: string[];
  viralSignals: ViralSignals;
}

export interface ClassificationOutput {
  clientPersona: ClientPersona;
  tags: string[];
  visualDirection: string;
  viralSignals: ViralSignals;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the content strategist for Smiley Solution, a high-end Tech Studio based in Thailand serving global high-ticket clients.
The studio's brand is "Editorial Minimalism" — premium, precise, and purposeful.

You produce two types of content:
1. Instagram FEED: Premium English copy. Hook-first, ROI-focused, designed to attract high-ticket clients (CMOs, Founders, Creative Directors). High contrast thinking. Strategic, not fluffy.
2. Instagram STORIES: Authentic Hebrew scripts. Behind-the-scenes from Thailand. Personal, trust-building, "building in public" energy. Warm and real, not corporate.

The five client personas you write for:
- analytical_ceo: Data-driven, ROI-focused, skeptical of hype. Wants proof and quantifiable outcomes.
- dreamer_founder: Vision-led, purpose-driven. Inspired by stories of impact and breakthrough thinking.
- creative_director: Aesthetic-first, craft-obsessed. Inspired by design details others miss.
- growth_hacker: Obsessed with frameworks and repeatable systems. Loves tactics and templates.
- lifestyle_visionary: Integrates work and life intentionally. Inspired by location independence and authentic freedom.

Always respond with valid JSON only. No markdown, no explanations, just the JSON object.`;

// ─── Full Processing (Manual Ingest / raw text only) ─────────────────────────

/**
 * Runs all three Claude calls in parallel: EN copy, HE script, classification.
 * Use this ONLY when the input is raw/unprocessed (manual ingest, plain URL).
 */
export async function processContent(input: RawProcessInput): Promise<ProcessOutput> {
  const [feedResult, storiesResult, classificationResult] = await Promise.all([
    generateFeedCopy(input),
    generateStoriesScript(input),
    classifyContent(input),
  ]);

  const viralSignals = buildViralSignals(
    input.engagementData,
    classificationResult.confidenceScore
  );

  return {
    feedCopyEn: feedResult,
    storiesScriptHe: storiesResult,
    visualDirection: classificationResult.visualDirection,
    clientPersona: classificationResult.persona,
    tags: classificationResult.tags,
    viralSignals,
  };
}

// ─── Classification Only (ScoutBot pre-processed copy) ───────────────────────

/**
 * Runs only the classification call: persona, tags, visual direction.
 * Use when copy is already generated (e.g., ScoutBot payload) but
 * persona/tags are missing. One Claude call instead of three.
 */
export async function classifyOnly(input: RawProcessInput): Promise<ClassificationOutput> {
  const result = await classifyContent(input);
  const viralSignals = buildViralSignals(input.engagementData, result.confidenceScore);

  return {
    clientPersona: result.persona,
    tags: result.tags,
    visualDirection: result.visualDirection,
    viralSignals,
  };
}

/**
 * Builds viral signals from raw engagement data alone — no Claude call needed.
 * Use when ScoutBot already provides persona/tags AND engagement data.
 */
export function buildViralSignalsOnly(
  engagementData?: RawProcessInput["engagementData"],
  confidenceScore = 75
): ViralSignals {
  return buildViralSignals(engagementData, confidenceScore);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip markdown code fences that Claude sometimes wraps around JSON responses. */
function extractJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

// ─── Private generators ───────────────────────────────────────────────────────

async function generateFeedCopy(input: RawProcessInput): Promise<string> {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write an Instagram FEED caption for this content.

Source title: ${input.title}
Content excerpt: ${input.rawExcerpt}

Requirements:
- Start with a strong hook (first line must stop the scroll)
- 150-220 characters for the visible preview, then expand
- English, premium tone, strategic insight
- End with a subtle CTA or thought-provoking question
- No emojis except sparingly at the end
- Instagram caption format (line breaks for readability)

Respond with JSON: { "caption": "..." }`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(extractJson(text)) as { caption: string };
  return parsed.caption;
}

async function generateStoriesScript(input: RawProcessInput): Promise<string> {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write an Instagram STORIES script in Hebrew for this content.

Source title: ${input.title}
Content excerpt: ${input.rawExcerpt}

Requirements:
- Hebrew (RTL), conversational and authentic
- Behind-the-scenes angle: "Here's what I'm learning/thinking about from my studio in Thailand"
- 3-5 story slides. Format as numbered slides: "1. ... | 2. ... | 3. ..."
- Personal, trust-building, NOT corporate
- Connect the global tech/design insight to the founder's personal journey
- Include one honest reflection or vulnerability moment

Respond with JSON: { "script": "..." }`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(extractJson(text)) as { script: string };
  return parsed.script;
}

interface ClassificationResult {
  persona: ClientPersona;
  tags: string[];
  visualDirection: string;
  confidenceScore: number;
}

async function classifyContent(input: RawProcessInput): Promise<ClassificationResult> {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Classify this content for Smiley Solution's content strategy.

Title: ${input.title}
Excerpt: ${input.rawExcerpt}

Analyze and respond with JSON:
{
  "persona": "analytical_ceo" | "dreamer_founder" | "creative_director" | "growth_hacker" | "lifestyle_visionary",
  "confidenceScore": 0-100,
  "tags": ["tag1", "tag2", "tag3"],
  "visualDirection": "One sentence describing the ideal visual/aesthetic for this post (color mood, composition style, photography direction)"
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(extractJson(text)) as ClassificationResult;
}

function buildViralSignals(
  engagementData: RawProcessInput["engagementData"],
  confidenceScore: number
): ViralSignals {
  const engagementCount =
    (engagementData?.shares ?? 0) +
    (engagementData?.comments ?? 0) +
    (engagementData?.saves ?? 0);

  const trendTags = engagementData?.trendTags ?? [];

  let label: ViralSignals["label"] = "thought_leader";
  if (engagementCount > 1000) {
    label = "high_engagement";
  } else if (trendTags.length > 0) {
    label = "trending_topic";
  }

  return { label, engagementCount, trendTags, confidenceScore };
}
