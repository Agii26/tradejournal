"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EquityPoint } from "@/lib/analytics";

export function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-hairline bg-surface text-sm text-muted">
        No closed trades yet
      </div>
    );
  }

  const chartData = data.map((p, i) => ({ ...p, index: i + 1 }));

  return (
    <div className="h-64 rounded-lg border border-hairline bg-surface px-2 py-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="index"
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--color-hairline)" }}
            tickLine={false}
            label={{ value: "Trade #", position: "insideBottom", offset: -2, fill: "var(--color-muted)", fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => (v >= 0 ? `$${v}` : `-$${Math.abs(v)}`)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => `Trade #${label}`}
            formatter={(value) => [`$${value}`, "Cumulative"]}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
