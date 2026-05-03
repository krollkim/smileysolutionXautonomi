"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import type { DateRange } from "@/server/routers/analytics";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { KpiCards } from "./KpiCards";
import { SmartInsights } from "./SmartInsights";
import { ContentTable } from "./ContentTable";
import { PostingHeatmap } from "./PostingHeatmap";
import { EngagementCharts } from "./EngagementCharts";
import { FollowerChart } from "./FollowerChart";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = "overview" | "content" | "performance";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview",     label: "סקירה כללית" },
  { key: "content",      label: "תוכן"        },
  { key: "performance",  label: "ביצועים"     },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const input = { dateRange };

  const overview        = trpc.analytics.overview.useQuery(input);
  const contentPerf     = trpc.analytics.contentPerformance.useQuery(input);
  const heatmap         = trpc.analytics.heatmapData.useQuery(input);
  const byHour          = trpc.analytics.engagementByHour.useQuery(input);
  const byDay           = trpc.analytics.engagementByDay.useQuery(input);
  const followerTimeline = trpc.analytics.followerTimeline.useQuery(input);
  const insights        = trpc.analytics.generateInsights.useQuery(input);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex flex-col gap-4">
          <div dir="rtl" className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
                אנליטיקס
              </h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                אצבע על הדופק — ביצועי תוכן בזמן אמת
              </p>
            </div>
          </div>

          <AnalyticsFilters dateRange={dateRange} onDateRangeChange={setDateRange} />

          {/* Tab nav */}
          <div className="flex items-center gap-1 border-b border-transparent" dir="rtl">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  activeTab === tab.key
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="analytics-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <KpiCards
                data={overview.data ?? null}
                isLoading={overview.isLoading}
              />

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3">
                  <SmartInsights
                    insights={insights.data ?? []}
                    isLoading={insights.isLoading}
                  />
                </div>
                <div className="lg:col-span-2">
                  <FollowerChart
                    data={followerTimeline.data ?? []}
                    isLoading={followerTimeline.isLoading}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "content" && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <ContentTable
                data={contentPerf.data ?? []}
                isLoading={contentPerf.isLoading}
              />

              <BestTimeCard byDay={byDay.data ?? []} byHour={byHour.data ?? []} isLoading={byDay.isLoading} />
            </motion.div>
          )}

          {activeTab === "performance" && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <PostingHeatmap
                data={heatmap.data ?? []}
                isLoading={heatmap.isLoading}
              />

              <EngagementCharts
                byHour={byHour.data ?? []}
                byDay={byDay.data ?? []}
                isLoading={byHour.isLoading}
              />

              <FollowerChart
                data={followerTimeline.data ?? []}
                isLoading={followerTimeline.isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Best-time card (used in content tab) ────────────────────────────────────

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface BestTimeCardProps {
  byDay: Array<{ day: number; label: string; avgEngagement: number }>;
  byHour: Array<{ hour: number; label: string; avgEngagement: number }>;
  isLoading: boolean;
}

function BestTimeCard({ byDay, byHour, isLoading }: BestTimeCardProps) {
  const bestDay  = byDay.reduce((best, curr) => curr.avgEngagement > best.avgEngagement ? curr : best, byDay[0] ?? { day: 0, label: DAYS_HE[0], avgEngagement: 0 });
  const bestHour = byHour.reduce((best, curr) => curr.avgEngagement > best.avgEngagement ? curr : best, byHour[0] ?? { hour: 12, label: "12:00", avgEngagement: 0 });

  return (
    <div className="card p-5" dir="rtl">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">הזמן הטוב ביותר לפרסם</h3>
      {isLoading ? (
        <div className="h-16 bg-[var(--bg-raised)] rounded animate-pulse" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--bg-raised)] rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-[var(--accent)]">{bestDay.label}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">היום הכי טוב</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{bestDay.avgEngagement.toFixed(2)}% אינגייג'מנט</p>
          </div>
          <div className="bg-[var(--bg-raised)] rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-[var(--accent)]">{bestHour.hour}:00</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">השעה הכי טובה</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{bestHour.avgEngagement.toFixed(2)}% אינגייג'מנט</p>
          </div>
        </div>
      )}
    </div>
  );
}
