import React from 'react';
import { Flame, Trophy, Clock, Award, Calendar } from 'lucide-react';

interface ActivityDay {
  date: string;
  count: number;
}

interface ContributionHeatmapProps {
  data: ActivityDay[];
  isLoading?: boolean;
}

/* ── Stat mini card ── */
function StatMini({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: '#FFFFFF',
        border: '1px solid #E8ECF1',
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1D2B', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

export function ContributionHeatmap({ data, isLoading = false }: ContributionHeatmapProps) {
  /* ── Build 7×22 grid (154 cells = ~5 months) ── */
  const COLS = 22; // ~5 months worth of weeks
  const ROWS = 7;  // Mon → Sun
  const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  /* Generate month labels for COLS columns */
  const getMonthLabels = () => {
    const now = new Date();
    const labels: { text: string; col: number }[] = [];
    let prevMonth = -1;
    for (let c = 0; c < COLS; c++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (COLS - 1 - c) * 7);
      const m = d.getMonth();
      if (m !== prevMonth) {
        labels.push({ text: `Tháng ${m + 1}`, col: c });
        prevMonth = m;
      }
    }
    return labels;
  };

  const monthLabels = getMonthLabels();

  /* Color cell based on count (0–6+) — blue-to-purple gradient */
  const getCellStyle = (count: number): React.CSSProperties => {
    if (count === 0) return { background: '#F0F2F5', border: '1px solid #E8ECF1' };
    if (count === 1) return { background: '#BFDBFE', border: '1px solid #93C5FD' };
    if (count === 2) return { background: '#93C5FD', border: '1px solid #60A5FA' };
    if (count === 3) return { background: '#6366F1', border: '1px solid #4F46E5' };
    if (count === 4) return { background: '#7C3AED', border: '1px solid #6D28D9' };
    return               { background: '#5B21B6', border: '1px solid #4C1D95' };
  };

  /* Build data array: col-major (column = week) */
  const cells: number[] = Array.from({ length: COLS * ROWS }, (_, i) => {
    if (data.length > 0) return data[i]?.count ?? 0;
    // demo data — heavier toward recent
    const colPct = Math.floor(i / ROWS) / COLS;
    return Math.random() < 0.55 ? (colPct > 0.6 ? Math.ceil(Math.random() * 5) : Math.ceil(Math.random() * 3)) : 0;
  });

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8ECF1',
        borderRadius: 12,
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{ padding: 8, background: '#EEF0FD', borderRadius: 9, display: 'flex' }}
          >
            <Calendar size={18} color="#4361EE" />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
              Lịch sử học tập
            </div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>
              Hoạt động học tập của bạn
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 500 }}>Ít</span>
          <div
            style={{
              width: 80,
              height: 10,
              borderRadius: 999,
              background: 'linear-gradient(to right, #BFDBFE, #6366F1, #5B21B6)',
              border: '1px solid #E8ECF1',
            }}
          />
          <span style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 500 }}>Nhiều</span>
        </div>
      </div>

      {/* ── Mini Stats Row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <StatMini
          icon={Flame}
          iconColor="#B45309"
          iconBg="#FFF7E6"
          label="Tổng thời gian học"
          value="120 giờ"
          sub="Tích lũy"
        />
        <StatMini
          icon={Trophy}
          iconColor="#7C3AED"
          iconBg="#F3F0FF"
          label="Chuỗi ngày cao nhất"
          value="15 ngày"
          sub="Kỷ lục"
        />
        <StatMini
          icon={Clock}
          iconColor="#1A8F5C"
          iconBg="#E6F9F0"
          label="Thời gian học tập"
          value="T6, 20:00"
          sub="Hôm nay"
        />
      </div>

      {/* ── Heatmap chart ── */}
      {isLoading ? (
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: COLS }).map((_, c) => (
            <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: ROWS }).map((_, r) => (
                <div
                  key={r}
                  className="skeleton"
                  style={{ width: 14, height: 14, borderRadius: 3 }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Day labels column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                paddingTop: 20, /* offset for month labels */
                marginRight: 8,
              }}
            >
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  style={{
                    height: 14,
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: '#9CA3AF',
                    lineHeight: '14px',
                    width: 20,
                    textAlign: 'right',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid columns */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Month labels row */}
              <div
                style={{
                  display: 'flex',
                  marginBottom: 6,
                  height: 14,
                  position: 'relative',
                }}
              >
                {monthLabels.map((ml) => (
                  <div
                    key={ml.col}
                    style={{
                      position: 'absolute',
                      left: ml.col * 18,
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ml.text}
                  </div>
                ))}
              </div>

              {/* Cell grid */}
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: COLS }).map((_, c) => (
                  <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Array.from({ length: ROWS }).map((_, r) => {
                      const count = cells[c * ROWS + r];
                      return (
                        <div
                          key={r}
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            cursor: 'default',
                            transition: 'opacity 0.15s',
                            ...getCellStyle(count),
                          }}
                          title={`${count} lượt luyện tập`}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Achievement section ── */}
      <div
        style={{
          marginTop: 18,
          padding: '14px 18px',
          background: '#F8F9FE',
          border: '1px solid #E8ECF1',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: '#EEF0FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Award size={18} color="#4361EE" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2B', marginBottom: 3 }}>
            Thành tích nổi bật
          </div>
          <div style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.5 }}>
            Bạn đã học tích cực hơn{' '}
            <span
              style={{
                display: 'inline-block',
                padding: '1px 10px',
                background: 'linear-gradient(135deg, #4361EE, #7C3AED)',
                color: '#fff',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 11.5,
              }}
            >
              85%
            </span>{' '}
            học viên khác trong tháng qua!
          </div>
        </div>
      </div>
    </div>
  );
}
