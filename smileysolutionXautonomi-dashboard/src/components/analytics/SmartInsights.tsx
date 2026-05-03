"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

interface Insight {
  emoji: string;
  title: string;
  body: string;
  colorClass: "green" | "yellow" | "blue";
}

interface SmartInsightsProps {
  insights: Insight[];
  isLoading?: boolean;
}

const COLOR_MAP = {
  green:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.18)"  },
  yellow: { bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.18)"  },
  blue:   { bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.18)" },
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export function SmartInsights({ insights, isLoading }: SmartInsightsProps) {
  return (
    <div className="card p-5" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💡</span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">תובנות חכמות</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-[var(--bg-raised)] rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {insights.map((insight, i) => {
            const colors = COLOR_MAP[insight.colorClass];
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="rounded-md px-4 py-3"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {insight.emoji} {insight.title}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {insight.body}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
