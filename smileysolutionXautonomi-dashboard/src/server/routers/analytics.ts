import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import Anthropic from "@anthropic-ai/sdk";

// ─── Shared schemas ───────────────────────────────────────────────────────────

const dateRangeSchema = z.enum(["7d", "14d", "30d", "90d"]).default("30d");

export type DateRange = z.infer<typeof dateRangeSchema>;

const DAY_LABELS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function getStartIso(dateRange: DateRange): string {
  const d = new Date();
  d.setDate(d.getDate() - parseInt(dateRange));
  return d.toISOString();
}

function toDateString(iso: string): string {
  return iso.split("T")[0];
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const analyticsRouter = router({
  // KPI card aggregates
  overview: protectedProcedure
    .input(z.object({ dateRange: dateRangeSchema }))
    .query(async ({ ctx, input }) => {
      const startIso = getStartIso(input.dateRange);
      const startDate = toDateString(startIso);

      const { data, error } = await ctx.supabase
        .from("daily_metrics")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const rows = data ?? [];

      if (rows.length === 0) {
        return { overallScore: 0, followerGrowthPct: 0, shareRate: 0, engagementRate: 0, totalReach: 0, newFollowers: 0 };
      }

      const earliest = rows[0];
      const latest = rows[rows.length - 1];

      const followerGrowthPct =
        earliest.followers_count > 0
          ? ((latest.followers_count - earliest.followers_count) / earliest.followers_count) * 100
          : 0;

      const avgEngagementRate = rows.reduce((s: number, r: { engagement_rate: number }) => s + (r.engagement_rate ?? 0), 0) / rows.length;
      const avgShareRate = rows.reduce((s: number, r: { share_rate: number }) => s + (r.share_rate ?? 0), 0) / rows.length;
      const totalReach = rows.reduce((s: number, r: { total_reach: number }) => s + (r.total_reach ?? 0), 0);
      const newFollowers = rows.reduce((s: number, r: { followers_gained: number }) => s + (r.followers_gained ?? 0), 0);

      // Weighted score: 50pts engagement (bench 2%), 30pts shares (bench 0.5%), 20pts growth (bench 5%)
      const engScore = Math.min((avgEngagementRate / 2.0) * 50, 50);
      const shareScore = Math.min((avgShareRate / 0.5) * 30, 30);
      const growthScore = Math.min((Math.abs(followerGrowthPct) / 5) * 20, 20);
      const overallScore = Math.round(engScore + shareScore + growthScore);

      return {
        overallScore: Math.min(overallScore, 100),
        followerGrowthPct: parseFloat(followerGrowthPct.toFixed(2)),
        shareRate: parseFloat(avgShareRate.toFixed(3)),
        engagementRate: parseFloat(avgEngagementRate.toFixed(2)),
        totalReach,
        newFollowers,
      };
    }),

  // Table: aggregate by post type
  contentPerformance: protectedProcedure
    .input(z.object({ dateRange: dateRangeSchema }))
    .query(async ({ ctx, input }) => {
      const startIso = getStartIso(input.dateRange);

      const { data, error } = await ctx.supabase
        .from("post_metrics")
        .select("post_type, shares, saves, engagement_rate")
        .gte("published_at", startIso);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const acc: Record<string, { posts: number; shares: number; saves: number; engagement: number }> = {
        image: { posts: 0, shares: 0, saves: 0, engagement: 0 },
        video_reel: { posts: 0, shares: 0, saves: 0, engagement: 0 },
        carousel: { posts: 0, shares: 0, saves: 0, engagement: 0 },
        story: { posts: 0, shares: 0, saves: 0, engagement: 0 },
      };

      (data ?? []).forEach((row: { post_type: string; shares: number; saves: number; engagement_rate: number }) => {
        const key = row.post_type;
        if (key in acc) {
          acc[key].posts++;
          acc[key].shares += row.shares ?? 0;
          acc[key].saves += row.saves ?? 0;
          acc[key].engagement += row.engagement_rate ?? 0;
        }
      });

      return Object.entries(acc).map(([postType, s]) => ({
        postType,
        totalPosts: s.posts,
        totalShares: s.shares,
        totalSaves: s.saves,
        avgEngagementRate: s.posts > 0 ? parseFloat((s.engagement / s.posts).toFixed(2)) : 0,
      }));
    }),

  // 7×24 engagement heatmap
  heatmapData: protectedProcedure
    .input(z.object({ dateRange: dateRangeSchema }))
    .query(async ({ ctx, input }) => {
      const startIso = getStartIso(input.dateRange);

      const { data, error } = await ctx.supabase
        .from("post_metrics")
        .select("published_at, engagement_rate")
        .gte("published_at", startIso);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const grid: Record<string, { total: number; count: number }> = {};
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          grid[`${d}:${h}`] = { total: 0, count: 0 };
        }
      }

      (data ?? []).forEach((row: { published_at: string; engagement_rate: number }) => {
        const dt = new Date(row.published_at);
        const key = `${dt.getDay()}:${dt.getHours()}`;
        if (grid[key]) {
          grid[key].total += row.engagement_rate ?? 0;
          grid[key].count++;
        }
      });

      return Object.entries(grid).map(([key, s]) => {
        const [day, hour] = key.split(":").map(Number);
        return { day, hour, value: s.count > 0 ? parseFloat((s.total / s.count).toFixed(3)) : 0 };
      });
    }),

  // Bar chart: avg engagement by hour (0-23)
  engagementByHour: protectedProcedure
    .input(z.object({ dateRange: dateRangeSchema }))
    .query(async ({ ctx, input }) => {
      const startIso = getStartIso(input.dateRange);

      const { data, error } = await ctx.supabase
        .from("post_metrics")
        .select("published_at, engagement_rate")
        .gte("published_at", startIso);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, total: 0, count: 0 }));

      (data ?? []).forEach((row: { published_at: string; engagement_rate: number }) => {
        const h = new Date(row.published_at).getHours();
        hours[h].total += row.engagement_rate ?? 0;
        hours[h].count++;
      });

      return hours.map(h => ({
        hour: h.hour,
        label: `${h.hour}:00`,
        avgEngagement: h.count > 0 ? parseFloat((h.total / h.count).toFixed(3)) : 0,
      }));
    }),

  // Bar chart: avg engagement by day of week
  engagementByDay: protectedProcedure
    .input(z.object({ dateRange: dateRangeSchema }))
    .query(async ({ ctx, input }) => {
      const startIso = getStartIso(input.dateRange);

      const { data, error } = await ctx.supabase
        .from("post_metrics")
        .select("published_at, engagement_rate")
        .gte("published_at", startIso);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const days = Array.from({ length: 7 }, (_, d) => ({ day: d, total: 0, count: 0 }));

      (data ?? []).forEach((row: { published_at: string; engagement_rate: number }) => {
        const d = new Date(row.published_at).getDay();
        days[d].total += row.engagement_rate ?? 0;
        days[d].count++;
      });

      return days.map((d, i) => ({
        day: d.day,
        label: DAY_LABELS_HE[i],
        avgEngagement: d.count > 0 ? parseFloat((d.total / d.count).toFixed(3)) : 0,
      }));
    }),

  // Line chart: follower count over time
  followerTimeline: protectedProcedure
    .input(z.object({ dateRange: dateRangeSchema }))
    .query(async ({ ctx, input }) => {
      const startDate = toDateString(getStartIso(input.dateRange));

      const { data, error } = await ctx.supabase
        .from("daily_metrics")
        .select("date, followers_count")
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return (data ?? []).map((row: { date: string; followers_count: number }) => ({
        date: row.date,
        followersCount: row.followers_count,
      }));
    }),

  // Single-post analytics drill-down
  postDrilldown: protectedProcedure
    .input(z.object({ contentPieceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("post_metrics")
        .select("*")
        .eq("content_piece_id", input.contentPieceId)
        .maybeSingle();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? null;
    }),

  // Claude-generated Hebrew insights
  generateInsights: protectedProcedure
    .input(z.object({ dateRange: dateRangeSchema }))
    .query(async ({ ctx, input }) => {
      const startIso = getStartIso(input.dateRange);
      const startDate = toDateString(startIso);
      const days = parseInt(input.dateRange);

      const [{ data: dailyData }, { data: postData }] = await Promise.all([
        ctx.supabase.from("daily_metrics").select("engagement_rate, share_rate, followers_gained").gte("date", startDate),
        ctx.supabase.from("post_metrics").select("published_at, engagement_rate").gte("published_at", startIso),
      ]);

      const daily = dailyData ?? [];
      const posts = postData ?? [];

      // Fallback when no data yet
      if (daily.length === 0 && posts.length === 0) {
        return [
          { emoji: "💡", title: "אין נתונים עדיין", body: 'הוסף מדדים דרך נקודת הקצה /api/metrics/seed כדי לקבל תובנות אוטומטיות.', colorClass: "blue" as const },
        ];
      }

      const avgEngagement = daily.length > 0
        ? daily.reduce((s: number, r: { engagement_rate: number }) => s + (r.engagement_rate ?? 0), 0) / daily.length
        : 0;
      const avgShareRate = daily.length > 0
        ? daily.reduce((s: number, r: { share_rate: number }) => s + (r.share_rate ?? 0), 0) / daily.length
        : 0;
      const totalNewFollowers = daily.reduce((s: number, r: { followers_gained: number }) => s + (r.followers_gained ?? 0), 0);

      // Best posting day
      const dayBuckets = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
      posts.forEach((p: { published_at: string; engagement_rate: number }) => {
        const d = new Date(p.published_at).getDay();
        dayBuckets[d].total += p.engagement_rate ?? 0;
        dayBuckets[d].count++;
      });
      const bestDayIdx = dayBuckets.reduce((best, curr, i) => {
        const currAvg = curr.count > 0 ? curr.total / curr.count : 0;
        const bestAvg = dayBuckets[best].count > 0 ? dayBuckets[best].total / dayBuckets[best].count : 0;
        return currAvg > bestAvg ? i : best;
      }, 0);
      const bestDayAvg = dayBuckets[bestDayIdx].count > 0
        ? (dayBuckets[bestDayIdx].total / dayBuckets[bestDayIdx].count).toFixed(2)
        : "0";

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return buildFallbackInsights(bestDayIdx, bestDayAvg, avgEngagement, avgShareRate);
      }

      try {
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          messages: [{
            role: "user",
            content: `אתה מומחה לאנליטיקס של אינסטגרם עבור חשבון עסקי בעברית.
בהתבסס על הנתונים הבאים מ-${days} הימים האחרונים, צור בדיוק 3 תובנות בעברית:

- ממוצע אינגייג'מנט יומי: ${avgEngagement.toFixed(2)}%
- ממוצע שיתופים: ${avgShareRate.toFixed(3)}%
- עוקבים חדשים: ${totalNewFollowers}
- היום הכי טוב לפרסם: ${DAY_LABELS_HE[bestDayIdx]} (אינגייג'מנט ${bestDayAvg}%)
- סה"כ פוסטים שנותחו: ${posts.length}

הגב עם JSON בלבד (ללא מרקדאון):
[
  { "emoji": "string", "title": "עברית", "body": "עברית", "colorClass": "green" | "yellow" | "blue" }
]`,
          }],
        });

        const raw = message.content[0].type === "text" ? message.content[0].text : "";
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        return JSON.parse(cleaned) as Array<{ emoji: string; title: string; body: string; colorClass: "green" | "yellow" | "blue" }>;
      } catch {
        return buildFallbackInsights(bestDayIdx, bestDayAvg, avgEngagement, avgShareRate);
      }
    }),
});

function buildFallbackInsights(
  bestDayIdx: number,
  bestDayAvg: string,
  avgEngagement: number,
  avgShareRate: number,
) {
  return [
    {
      emoji: "🏆",
      title: `היום הכי טוב לפרסם: ${DAY_LABELS_HE[bestDayIdx]}`,
      body: `ממוצע אינגייג'מנט של ${bestDayAvg}% — זה הזמן לפרסם את התוכן הטוב ביותר שלך.`,
      colorClass: "green" as const,
    },
    {
      emoji: "🔥",
      title: "ביצועי שיתופים",
      body: `שיעור שיתוף ממוצע: ${avgShareRate.toFixed(3)}%. ${avgShareRate > 0.3 ? "ביצועים מעל הממוצע — המשיכו לפרסם תוכן בעל ערך!" : "שפרו את הנעה לפעולה בסוף הפוסטים."}`,
      colorClass: "yellow" as const,
    },
    {
      emoji: "📊",
      title: "אינגייג'מנט כולל",
      body: `ממוצע אינגייג'מנט: ${avgEngagement.toFixed(2)}%. ${avgEngagement > 1.5 ? "מעל הממוצע בתעשייה!" : "שאפו ל-2% ומעלה עם תוכן אינטראקטיבי."}`,
      colorClass: "blue" as const,
    },
  ];
}
