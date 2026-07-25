"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { HistogramBucket } from "@/lib/analytics";

export function RMultipleHistogram({ data }: { data: HistogramBucket[] }) {
  const total = data.reduce((sum, b) => sum + b.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-hairline bg-surface text-sm text-muted">
        No trades with risk amount set yet
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg border border-hairline bg-surface px-2 py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 16, bottom: 24, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            axisLine={{ stroke: "var(--color-hairline)" }}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [value, "Trades"]}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.label.includes("-") || entry.label.startsWith("≤") ? "var(--color-error)" : "var(--color-accent)"}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
