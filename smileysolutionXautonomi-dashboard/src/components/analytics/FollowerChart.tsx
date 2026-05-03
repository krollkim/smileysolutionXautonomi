"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

interface FollowerPoint {
  date: string;
  followersCount: number;
}

interface FollowerChartProps {
  data: FollowerPoint[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const tooltipStyle = {
  backgroundColor: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: 6,
  fontSize: 11,
  color: "var(--text-primary)",
};

export function FollowerChart({ data, isLoading }: FollowerChartProps) {
  const chartData = data.map((p) => ({ ...p, dateLabel: formatDate(p.date) }));

  return (
    <motion.div
      className="card p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
    >
      <div dir="rtl" className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">עוקבים לאורך זמן</h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">מגמת גדילת קהילה</p>
      </div>

      {isLoading ? (
        <div className="h-44 bg-[var(--bg-raised)] rounded animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-[var(--text-tertiary)]" dir="rtl">
          אין נתוני עוקבים לתקופה זו
        </div>
      ) : (
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={176}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCount}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: unknown) => [typeof val === "number" ? val.toLocaleString() : "0", "עוקבים"]}
                cursor={{ stroke: "rgba(147,51,234,0.3)", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="followersCount"
                stroke="#9333ea"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#9333ea", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
