import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useChartColors } from "../../hooks/useChartColors";

function formatTickDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function ChartTooltip({ active, payload, colors }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-lg"
      style={{ background: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }}
    >
      <div className="font-mono text-[11px]" style={{ color: colors.textTertiary }}>
        {formatTickDate(point.date)} · test #{point.testNumber}
      </div>
      <div className="mt-1 font-semibold">{point.wpm} WPM</div>
    </div>
  );
}

/**
 * Renders the authenticated user's actual WPM trend. `trend` is the
 * array returned by GET /api/results/me/analytics — nothing here is
 * invented, smoothed, or backfilled. A single data point still shows
 * a clearly visible dot rather than an empty-looking line.
 */
export default function WpmChart({ trend }) {
  const colors = useChartColors();

  if (!trend || trend.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface/30 text-sm text-text-tertiary">
        No WPM data for this period yet.
      </div>
    );
  }

  const isSinglePoint = trend.length === 1;

  return (
    <div className="h-64 w-full rounded-lg border border-border bg-surface/40 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTickDate}
            stroke={colors.textTertiary}
            tick={{ fill: colors.textTertiary, fontSize: 11 }}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            stroke={colors.textTertiary}
            tick={{ fill: colors.textTertiary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={isSinglePoint ? [Math.max(0, trend[0].wpm - 10), trend[0].wpm + 10] : ["auto", "auto"]}
          />
          <Tooltip content={<ChartTooltip colors={colors} />} cursor={{ stroke: colors.border }} />
          <Line
            type="monotone"
            dataKey="wpm"
            stroke={colors.accent}
            strokeWidth={2}
            dot={{ r: isSinglePoint ? 5 : 3, fill: colors.accent, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
