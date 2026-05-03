"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

interface KpiData {
  overallScore: number;
  followerGrowthPct: number;
  shareRate: number;
  engagementRate: number;
  totalReach: number;
  newFollowers: number;
}

interface KpiCardsProps {
  data: KpiData | null;
  isLoading?: boolean;
}

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircularGauge({ score }: { score: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border-default)" strokeWidth="5" />
      <motion.circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - filled }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ transformOrigin: "50% 50%", transform: "rotate(-90deg)" }}
      />
      <text
        x="36"
        y="41"
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize="14"
        fontWeight="600"
      >
        {score}
      </text>
    </svg>
  );
}

// ─── Card config ──────────────────────────────────────────────────────────────

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface CardDef {
  key: keyof KpiData;
  label: string;
  color: string;
  format: (v: number) => string;
  isGauge?: boolean;
}

const CARDS: CardDef[] = [
  { key: "overallScore",      label: "ציון כולל",         color: "#22c55e", format: (v) => `${v}/100`,          isGauge: true  },
  { key: "followerGrowthPct", label: "צמיחת עוקבים",      color: "#60a5fa", format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%` },
  { key: "shareRate",         label: "שיעור שיתוף",        color: "#f87171", format: (v) => `${v.toFixed(2)}%`                   },
  { key: "engagementRate",    label: "שיעור אינגייג'מנט",  color: "#fb923c", format: (v) => `${v.toFixed(2)}%`                   },
  { key: "totalReach",        label: "סה\"כ חשיפה",        color: "#f472b6", format: (v) => formatReach(v)                       },
  { key: "newFollowers",      label: "עוקבים חדשים",       color: "#a78bfa", format: (v) => `+${v.toLocaleString()}`             },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function KpiCards({ data, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {CARDS.map((c) => (
          <div key={c.key} className="card p-4 animate-pulse">
            <div className="h-8 bg-[var(--bg-raised)] rounded mb-2 w-3/4" />
            <div className="h-3 bg-[var(--bg-raised)] rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const values = data ?? { overallScore: 0, followerGrowthPct: 0, shareRate: 0, engagementRate: 0, totalReach: 0, newFollowers: 0 };

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {CARDS.map((card) => {
        const raw = values[card.key] as number;

        return (
          <motion.div
            key={card.key}
            variants={cardVariants}
            className="card p-4 flex flex-col gap-3"
            style={{ borderColor: `${card.color}22` }}
          >
            {card.isGauge ? (
              <div className="flex items-center gap-3">
                <CircularGauge score={raw} />
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{card.label}</p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="text-2xl font-semibold tracking-tight"
                  style={{ color: card.color }}
                >
                  {!data ? "—" : card.format(raw)}
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">{card.label}</p>
              </>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
