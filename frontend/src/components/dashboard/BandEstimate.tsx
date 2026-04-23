import { useState } from 'react';
import { TrendingUp, ChevronDown, Lightbulb } from 'lucide-react';

interface BandEstimateProps {
  currentBand: number;
  change?: number;
  tips: { title: string; content: string }[];
  isLoading?: boolean;
}

export function BandEstimate({ currentBand, change = 0, tips, isLoading = false }: BandEstimateProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div
      className="card p-5 flex flex-col gap-4 h-full hover-lift"
      style={{ borderTop: '2px solid var(--primary)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Ước lượng Band
        </h3>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-body)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
          10 bài gần nhất
        </span>
      </div>

      {/* Band score */}
      <div className="flex items-end gap-3">
        <div className="text-5xl font-bold font-heading" style={{ color: 'var(--primary)' }}>
          {currentBand.toFixed(1)}
        </div>
        <div className="mb-1 flex flex-col">
          <span
            className="text-sm font-semibold flex items-center gap-1"
            style={{ color: change >= 0 ? 'var(--success)' : 'var(--error)' }}
          >
            {change >= 0 ? '+' : ''}{change.toFixed(1)}
            <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tháng này</span>
        </div>
      </div>

      {/* Tips accordion */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 section-label">
          <Lightbulb className="w-3 h-3" />
          Lưu ý cải thiện
        </div>
        <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden transition-colors"
              style={{
                background: 'var(--bg-body)',
                border: '1px solid var(--border-light)',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
              >
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {tip.title}
                </span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0"
                  style={{ color: 'var(--text-muted)', transform: openIndex === index ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-250"
                style={{ maxHeight: openIndex === index ? '80px' : '0', opacity: openIndex === index ? 1 : 0 }}
              >
                <div
                  className="px-3 pb-3 text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)' }}
                >
                  {tip.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
