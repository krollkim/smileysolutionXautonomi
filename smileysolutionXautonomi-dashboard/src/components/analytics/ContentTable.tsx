"use client";

import { motion } from "framer-motion";

interface ContentRow {
  postType: string;
  totalPosts: number;
  totalShares: number;
  totalSaves: number;
  avgEngagementRate: number;
}

interface ContentTableProps {
  data: ContentRow[];
  isLoading?: boolean;
}

const TYPE_CONFIG: Record<string, { labelHe: string; color: string }> = {
  image:     { labelHe: "תמונה",      color: "#22c55e" },
  video_reel:{ labelHe: "וידאו / ריל", color: "#f87171" },
  carousel:  { labelHe: "קרוסלה",     color: "#a78bfa" },
  story:     { labelHe: "סיפור",      color: "#fb923c" },
};

const ORDER = ["image", "video_reel", "carousel", "story"];

const COLUMNS = [
  { key: "type",              label: "סוג תוכן"   },
  { key: "totalShares",       label: "שיתופים"    },
  { key: "totalSaves",        label: "שמירות"     },
  { key: "totalPosts",        label: "פוסטים"     },
  { key: "avgEngagementRate", label: "אינגייג'מנט %" },
];

export function ContentTable({ data, isLoading }: ContentTableProps) {
  const sorted = ORDER.map((type) => data.find((r) => r.postType === type)).filter(Boolean) as ContentRow[];

  return (
    <div className="card p-5" dir="rtl">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        ביצועים לפי סוג תוכן
      </h2>
      <p className="text-xs text-[var(--text-tertiary)] mb-4">מה האלגוריתם מתגמל</p>

      {isLoading ? (
        <div className="space-y-2">
          {ORDER.map((k) => <div key={k} className="h-10 bg-[var(--bg-raised)] rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="pb-2 text-right text-xs font-medium text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const cfg = TYPE_CONFIG[row.postType] ?? { labelHe: row.postType, color: "#888" };
                return (
                  <motion.tr
                    key={row.postType}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    className="border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <td className="py-3 pr-0 pl-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                      >
                        {cfg.labelHe}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[var(--text-primary)]">{row.totalShares.toLocaleString()}</td>
                    <td className="py-3 text-right text-[var(--text-primary)]">{row.totalSaves.toLocaleString()}</td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">{row.totalPosts}</td>
                    <td className="py-3 text-right">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: row.avgEngagementRate > 1.5 ? "#22c55e" : row.avgEngagementRate > 0.5 ? "#fb923c" : "var(--text-tertiary)" }}
                      >
                        {row.avgEngagementRate.toFixed(2)}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}

              {sorted.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--text-tertiary)] text-xs">
                    אין נתונים זמינים לתקופה זו
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
