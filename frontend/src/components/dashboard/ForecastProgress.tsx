import React from 'react';
import { BarChart3 } from 'lucide-react';

interface PartProgress {
  part: string;
  completed: number;
  total: number;
  color: string;
}

interface ForecastProgressProps {
  progress: PartProgress[];
  isLoading?: boolean;
}

const PART_COLORS: Record<number, string> = {
  0: '#4361EE',
  1: '#7C3AED',
  2: '#22A06B',
};

export function ForecastProgress({ progress, isLoading = false }: ForecastProgressProps) {
  return (
    <div className="card p-5 flex flex-col gap-4 h-full hover-lift">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Tiến độ Forecast
        </h3>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-body)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
          Quý 1, 2026
        </span>
      </div>

      <div className="space-y-4 flex-1">
        {progress.map((p, index) => {
          const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
          const barColor = PART_COLORS[index] ?? 'var(--primary)';
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {p.part}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.completed}</span>/{p.total}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar__fill transition-all duration-1000"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="w-full py-2 rounded-xl text-xs font-semibold transition-colors hover-lift mt-auto"
        style={{
          background: 'var(--bg-body)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-light)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--primary-bg)';
          (e.currentTarget as HTMLElement).style.color = 'var(--primary-text)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-body)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
        }}
      >
        Xem chi tiết lộ trình
      </button>
    </div>
  );
}
