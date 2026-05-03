import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  pgEnum,
  integer,
  real,
  date,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const contentStatusEnum = pgEnum("content_status", [
  "inbox",
  "starred",
  "draft",
  "approved",
  "produced",
  "published",
  "archived",
]);

export const clientPersonaEnum = pgEnum("client_persona", [
  "analytical_ceo",
  "dreamer_founder",
  "creative_director",
  "growth_hacker",
  "lifestyle_visionary",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "feed",
  "stories",
  "both",
]);

export const contentSourceEnum = pgEnum("content_source", [
  "scoutbot",
  "telegram",
  "apify",
  "manual",
]);

export const viralSignalLabelEnum = pgEnum("viral_signal_label", [
  "high_engagement",
  "trending_topic",
  "thought_leader",
  "contrarian_take",
  "timely_news",
]);

export const pipelineEventEnum = pgEnum("pipeline_event", [
  "ingested",
  "ai_processed",
  "starred",
  "approved",
  "rejected",
  "produced",
  "published",
  "archived",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const contentPieces = pgTable("content_pieces", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  rawExcerpt: text("raw_excerpt"),

  // Dual-language copy
  feedCopyEn: text("feed_copy_en"),
  storiesScriptHe: text("stories_script_he"),
  visualDirection: text("visual_direction"),

  // Classification
  clientPersona: clientPersonaEnum("client_persona"),
  status: contentStatusEnum("status").notNull().default("inbox"),
  contentType: contentTypeEnum("content_type").notNull().default("both"),
  source: contentSourceEnum("source").notNull().default("manual"),

  // Viral intelligence (stored as JSONB)
  // Shape: { label: string, engagementCount: number, trendTags: string[], confidenceScore: number }
  viralSignals: jsonb("viral_signals"),

  // Media
  mediaAssets: jsonb("media_assets"), // Array<{ url: string, type: 'image'|'video', alt: string }>
  tags: text("tags").array(),

  // Scheduling
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const personas = pgTable("personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: clientPersonaEnum("key").notNull().unique(),
  name: text("name").notNull(),
  toneProfile: text("tone_profile").notNull(),
  targetPain: text("target_pain").notNull(),
  exampleHook: text("example_hook").notNull(),
  color: text("color").notNull().default("#6B7280"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pipelineLogs = pgTable("pipeline_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id").references(() => contentPieces.id, {
    onDelete: "cascade",
  }),
  event: pipelineEventEnum("event").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const postTypeEnum = pgEnum("post_type", [
  "image",
  "video_reel",
  "carousel",
  "story",
]);

export const dailyMetrics = pgTable("daily_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").notNull().default("default"),
  date: date("date").notNull(),
  followersCount: integer("followers_count").notNull().default(0),
  followersGained: integer("followers_gained").notNull().default(0),
  totalReach: integer("total_reach").notNull().default(0),
  totalImpressions: integer("total_impressions").notNull().default(0),
  profileViews: integer("profile_views").notNull().default(0),
  websiteClicks: integer("website_clicks").notNull().default(0),
  engagementRate: real("engagement_rate").notNull().default(0),
  shareRate: real("share_rate").notNull().default(0),
  avgSaves: real("avg_saves").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const postMetrics = pgTable("post_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentPieceId: uuid("content_piece_id").references(() => contentPieces.id, {
    onDelete: "cascade",
  }),
  instagramPostId: text("instagram_post_id"),
  postType: postTypeEnum("post_type").notNull().default("image"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  reach: integer("reach").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  engagementRate: real("engagement_rate").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type PostMetric = typeof postMetrics.$inferSelect;
export type PostType = PostMetric["postType"];

export type ContentPiece = typeof contentPieces.$inferSelect;
export type NewContentPiece = typeof contentPieces.$inferInsert;
export type Persona = typeof personas.$inferSelect;
export type PipelineLog = typeof pipelineLogs.$inferSelect;

export type ContentStatus = ContentPiece["status"];
export type ClientPersona = ContentPiece["clientPersona"];

export interface ViralSignals {
  label:
    | "high_engagement"
    | "trending_topic"
    | "thought_leader"
    | "contrarian_take"
    | "timely_news";
  engagementCount: number;
  trendTags: string[];
  confidenceScore: number; // 0-100
}

export interface MediaAsset {
  url: string;
  type: "image" | "video";
  alt: string;
}
