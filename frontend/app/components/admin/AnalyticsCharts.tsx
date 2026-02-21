import React from 'react';
import type { AnalyticsData } from '../../lib/types';

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Query Volume Chart */}
      <div className="bg-root-card border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Query Volume</h3>
        {data.query_volume.length > 0 ? (
          <QueryVolumeChart data={data.query_volume} />
        ) : (
          <p className="text-root-muted text-sm text-center py-8">No data available</p>
        )}
      </div>

      {/* Satisfaction Donut */}
      <div className="bg-root-card border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">User Satisfaction</h3>
        <SatisfactionChart satisfaction={data.satisfaction} />
      </div>
    </div>
  );
}

function QueryVolumeChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const width = 400;
  const height = 150;
  const padding = { top: 10, right: 10, bottom: 25, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.count / maxCount) * chartH,
  }));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = line + ` L ${points[points.length - 1]?.x || 0} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={padding.left}
          y1={padding.top + chartH * (1 - ratio)}
          x2={width - padding.right}
          y2={padding.top + chartH * (1 - ratio)}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((ratio) => (
        <text
          key={ratio}
          x={padding.left - 5}
          y={padding.top + chartH * (1 - ratio) + 3}
          fill="#94a3b8"
          fontSize="8"
          textAnchor="end"
        >
          {Math.round(maxCount * ratio)}
        </text>
      ))}
      {/* Area fill */}
      {points.length > 1 && <path d={area} fill="rgba(204,255,0,0.1)" />}
      {/* Line */}
      {points.length > 1 && <path d={line} fill="none" stroke="#ccff00" strokeWidth="2" />}
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ccff00" />
      ))}
      {/* X-axis labels (show first, middle, last) */}
      {data.length > 0 && [0, Math.floor(data.length / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
        <text
          key={i}
          x={points[i]?.x || 0}
          y={height - 5}
          fill="#94a3b8"
          fontSize="8"
          textAnchor="middle"
        >
          {data[i]?.date.slice(5) || ''}
        </text>
      ))}
    </svg>
  );
}

function SatisfactionChart({ satisfaction }: { satisfaction: { up: number; down: number; neutral: number } }) {
  const total = satisfaction.up + satisfaction.down + satisfaction.neutral;
  const pct = total > 0 ? Math.round((satisfaction.up / total) * 100) : 100;

  const radius = 50;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { value: satisfaction.up, color: '#4ade80' },
    { value: satisfaction.down, color: '#f87171' },
    { value: satisfaction.neutral, color: '#64748b' },
  ].filter((s) => s.value > 0);

  let offset = 0;

  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 120 120" className="w-32 h-32">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
        ) : (
          segments.map((seg, i) => {
            const pctVal = seg.value / total;
            const dashArray = `${pctVal * circumference} ${circumference}`;
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={dashArray}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += pctVal * circumference;
            return el;
          })
        )}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
          {pct}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="9">
          satisfied
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-sm text-root-text">Positive ({satisfaction.up})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-sm text-root-text">Negative ({satisfaction.down})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-500" />
          <span className="text-sm text-root-text">No feedback ({satisfaction.neutral})</span>
        </div>
      </div>
    </div>
  );
}
