export type ContentStatus =
  | "inbox"
  | "starred"
  | "draft"
  | "approved"
  | "produced"
  | "published"
  | "archived";

export type ClientPersona =
  | "analytical_ceo"
  | "dreamer_founder"
  | "creative_director"
  | "growth_hacker"
  | "lifestyle_visionary";

export type ContentType = "feed" | "stories" | "both";

export type ViralSignalLabel =
  | "high_engagement"
  | "trending_topic"
  | "thought_leader"
  | "contrarian_take"
  | "timely_news";

export interface ViralSignals {
  label: ViralSignalLabel;
  engagementCount: number;
  trendTags: string[];
  confidenceScore: number; // 0–100
}

export interface MediaAsset {
  url: string;
  type: "image" | "video";
  alt: string;
}

export interface ContentPiece {
  id: string;
  title: string;
  sourceUrl?: string | null;
  rawExcerpt?: string | null;
  feedCopyEn?: string | null;
  storiesScriptHe?: string | null;
  visualDirection?: string | null;
  clientPersona?: ClientPersona | null;
  status: ContentStatus;
  contentType: ContentType;
  source: "scoutbot" | "telegram" | "apify" | "manual";
  viralSignals?: ViralSignals | null;
  mediaAssets?: MediaAsset[] | null;
  tags?: string[] | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Persona {
  id: string;
  key: ClientPersona;
  name: string;
  toneProfile: string;
  targetPain: string;
  exampleHook: string;
  color: string;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

import { t } from "@/lib/i18n/he";

export const PERSONA_CONFIG: Record<
  ClientPersona,
  { label: string; color: string; cssVar: string }
> = {
  analytical_ceo: {
    label: t.personaLabels.analytical_ceo,
    color: "#60A5FA",
    cssVar: "var(--persona-ceo)",
  },
  dreamer_founder: {
    label: t.personaLabels.dreamer_founder,
    color: "#F472B6",
    cssVar: "var(--persona-founder)",
  },
  creative_director: {
    label: t.personaLabels.creative_director,
    color: "#A78BFA",
    cssVar: "var(--persona-director)",
  },
  growth_hacker: {
    label: t.personaLabels.growth_hacker,
    color: "#34D399",
    cssVar: "var(--persona-hacker)",
  },
  lifestyle_visionary: {
    label: t.personaLabels.lifestyle_visionary,
    color: "#FB923C",
    cssVar: "var(--persona-visionary)",
  },
};

export const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; color: string }
> = {
  inbox:     { label: t.statusLabels.inbox,     color: "#3B82F6" },
  starred:   { label: t.statusLabels.starred,   color: "#F59E0B" },
  draft:     { label: t.statusLabels.draft,     color: "#6B7280" },
  approved:  { label: t.statusLabels.approved,  color: "#10B981" },
  produced:  { label: t.statusLabels.produced,  color: "#8B5CF6" },
  published: { label: t.statusLabels.published, color: "#E8FF5A" },
  archived:  { label: t.statusLabels.archived,  color: "#374151" },
};

export const VIRAL_SIGNAL_CONFIG: Record<
  ViralSignalLabel,
  { label: string; emoji: string }
> = {
  high_engagement: { label: t.viralSignals.high_engagement.label, emoji: t.viralSignals.high_engagement.emoji },
  trending_topic:  { label: t.viralSignals.trending_topic.label,  emoji: t.viralSignals.trending_topic.emoji  },
  thought_leader:  { label: t.viralSignals.thought_leader.label,  emoji: t.viralSignals.thought_leader.emoji  },
  contrarian_take: { label: t.viralSignals.contrarian_take.label, emoji: t.viralSignals.contrarian_take.emoji },
  timely_news:     { label: t.viralSignals.timely_news.label,     emoji: t.viralSignals.timely_news.emoji     },
};
