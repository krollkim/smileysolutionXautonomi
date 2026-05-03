"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface HourData {
  hour: number;
  label: string;
  avgEngagement: number;
}

interface DayData {
  day: number;
  label: string;
  avgEngagement: number;
}

interface EngagementChartsProps {
  byHour: HourData[];
  byDay: DayData[];
  isLoading?: boolean;
}

const tooltipStyle = {
  backgroundColor: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: 6,
  fontSize: 11,
  color: "var(--text-primary)",
};

function ChartSkeleton() {
  return <div className="h-40 bg-[var(--bg-raised)] rounded animate-pulse" />;
}

function HourChart({ data }: { data: HourData[] }) {
  const maxVal = Math.max(...data.map((d) => d.avgEngagement), 0.001);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: unknown) => [`${typeof val === "number" ? val.toFixed(2) : "0"}%`, "אינגייג'מנט"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="avgEngagement" radius={[2, 2, 0, 0]} maxBarSize={14}>
          {data.map((entry) => (
            <Cell
              key={entry.hour}
              fill={`rgba(34, 197, 94, ${0.3 + (entry.avgEngagement / maxVal) * 0.7})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DayChart({ data }: { data: DayData[] }) {
  const maxVal = Math.max(...data.map((d) => d.avgEngagement), 0.001);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: unknown) => [`${typeof val === "number" ? val.toFixed(2) : "0"}%`, "אינגייג'מנט"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="avgEngagement" radius={[2, 2, 0, 0]} maxBarSize={28}>
          {data.map((entry) => (
            <Cell
              key={entry.day}
              fill={`rgba(236, 72, 153, ${0.3 + (entry.avgEngagement / maxVal) * 0.7})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EngagementCharts({ byHour, byDay, isLoading }: EngagementChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr">
      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-3 text-right" dir="rtl">
          אינגייג'מנט לפי שעה
        </p>
        {isLoading ? <ChartSkeleton /> : <HourChart data={byHour} />}
      </motion.div>

      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-3 text-right" dir="rtl">
          אינגייג'מנט לפי יום
        </p>
        {isLoading ? <ChartSkeleton /> : <DayChart data={byDay} />}
      </motion.div>
    </div>
  );
}
