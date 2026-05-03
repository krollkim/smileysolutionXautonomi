"use client";

import { motion } from "framer-motion";
import type { DateRange } from "@/server/routers/analytics";

interface AnalyticsFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
}

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d",  label: "7 ימים"  },
  { value: "14d", label: "14 ימים" },
  { value: "30d", label: "30 ימים" },
  { value: "90d", label: "90 ימים" },
];

export function AnalyticsFilters({ dateRange, onDateRangeChange }: AnalyticsFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap" dir="rtl">
      {/* Account pill */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          S
        </div>
        <span className="text-xs text-[var(--text-secondary)]">@smiley_solution</span>
      </div>

      {/* Date range selector */}
      <div className="flex items-center gap-1 bg-[var(--bg-raised)] rounded-lg p-0.5">
        {DATE_OPTIONS.map((opt) => {
          const isActive = dateRange === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onDateRangeChange(opt.value)}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="filter-active"
                  className="absolute inset-0 bg-[var(--bg-overlay)] rounded-md border border-[var(--border-default)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
