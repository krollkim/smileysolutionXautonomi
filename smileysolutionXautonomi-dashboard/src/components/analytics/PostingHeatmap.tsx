"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface HeatmapCell {
  day: number;
  hour: number;
  value: number;
}

interface PostingHeatmapProps {
  data: HeatmapCell[];
  isLoading?: boolean;
}

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function getPurpleOpacity(value: number, max: number): number {
  if (max === 0) return 0.04;
  return 0.06 + (value / max) * 0.88;
}

interface TooltipState {
  x: number;
  y: number;
  day: number;
  hour: number;
  value: number;
}

export function PostingHeatmap({ data, isLoading }: PostingHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="h-4 bg-[var(--bg-raised)] rounded w-64 mb-4 animate-pulse" />
        <div className="h-40 bg-[var(--bg-raised)] rounded animate-pulse" />
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 0.001);

  // Build lookup map
  const lookup: Record<string, number> = {};
  data.forEach((cell) => {
    lookup[`${cell.day}:${cell.hour}`] = cell.value;
  });

  return (
    <div className="card p-5" dir="rtl">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        מפת חום — מתי הקהל שלך הכי פעיל
      </h2>
      <p className="text-xs text-[var(--text-tertiary)] mb-4">ממוצע אינגייג'מנט לפי יום ושעה</p>

      <div className="overflow-x-auto" dir="ltr">
        <div className="min-w-[640px]">
          {/* Hour labels */}
          <div className="flex mb-1 mr-[72px]">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="flex-1 text-center text-[9px] text-[var(--text-tertiary)]"
                style={{ minWidth: 22 }}
              >
                {h % 4 === 0 ? `${h}` : ""}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {Array.from({ length: 7 }, (_, dayIdx) => (
            <div key={dayIdx} className="flex items-center mb-0.5">
              {/* Day label — show reversed for RTL display */}
              <div
                className="w-[72px] shrink-0 text-[10px] text-[var(--text-tertiary)] text-right pr-2"
                dir="rtl"
              >
                {DAYS_HE[dayIdx]}
              </div>

              {Array.from({ length: 24 }, (_, hour) => {
                const val = lookup[`${dayIdx}:${hour}`] ?? 0;
                const opacity = getPurpleOpacity(val, maxValue);

                return (
                  <motion.div
                    key={hour}
                    className="flex-1 rounded-[2px] cursor-pointer"
                    style={{
                      minWidth: 22,
                      height: 18,
                      background: `rgba(147, 51, 234, ${opacity})`,
                      border: "1px solid rgba(147, 51, 234, 0.08)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (dayIdx * 24 + hour) * 0.001 }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ x: rect.left + rect.width / 2, y: rect.top, day: dayIdx, hour, value: val });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-[var(--text-tertiary)]">נמוך</span>
            {[0.06, 0.25, 0.45, 0.65, 0.85, 0.94].map((op) => (
              <div
                key={op}
                className="w-3 h-3 rounded-[2px]"
                style={{ background: `rgba(147, 51, 234, ${op})` }}
              />
            ))}
            <span className="text-[10px] text-[var(--text-tertiary)]">גבוה</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-md text-xs text-white shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 40,
            transform: "translateX(-50%)",
            background: "rgba(20,20,20,0.95)",
            border: "1px solid var(--border-default)",
          }}
        >
          {DAYS_HE[tooltip.day]} {tooltip.hour}:00 — {tooltip.value.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
