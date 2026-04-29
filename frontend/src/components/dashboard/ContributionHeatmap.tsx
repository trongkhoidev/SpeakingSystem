import React, { useMemo } from 'react';
import { Flame, Trophy, Clock, Award, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
  delay = 0,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative flex-1 flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: iconBg }}
      >
        <Icon size={20} color={iconColor} />
      </div>
      <div>
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-xl font-black text-slate-900 leading-none">{value}</div>
        <div className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</div>
      </div>
    </motion.div>
  );
}

export function ContributionHeatmap({ data, isLoading = false }: ContributionHeatmapProps) {
  const COLS = 22; 
  const ROWS = 7;  
  const DAY_LABELS = ['T2', '', 'T4', '', 'T6', '', 'CN'];

  /* ── Correct Calendar Logic ── */
  const gridData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find this week's Monday
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + diffToMonday);

    // Start date is COLS-1 weeks ago from this Monday
    const startDate = new Date(thisMonday);
    startDate.setDate(thisMonday.getDate() - (COLS - 1) * 7);

    const weeks: { date: Date; cells: { count: number; dateStr: string; date: Date }[] }[] = [];
    const labels: { text: string; col: number }[] = [];
    let lastMonth = -1;
    let lastLabelCol = -10;

    for (let c = 0; c < COLS; c++) {
      const weekMonday = new Date(startDate);
      weekMonday.setDate(startDate.getDate() + c * 7);
      
      const cells = [];
      for (let r = 0; r < ROWS; r++) {
        const cellDate = new Date(weekMonday);
        cellDate.setDate(weekMonday.getDate() + r);
        const dateStr = cellDate.toISOString().split('T')[0];
        
        const isFuture = cellDate > now;
        const dayData = !isFuture ? data?.find(d => d.date === dateStr) : null;
        
        cells.push({
          dateStr,
          date: cellDate,
          count: dayData ? dayData.count : (isFuture ? -1 : 0)
        });

        // Month label logic: at least 3 columns apart
        if (r === 0) {
          const m = cellDate.getMonth();
          if (m !== lastMonth && (c - lastLabelCol) > 2) {
            labels.push({ text: `Tháng ${m + 1}`, col: c });
            lastMonth = m;
            lastLabelCol = c;
          }
        }
      }
      weeks.push({ date: weekMonday, cells });
    }

    return { weeks, labels };
  }, [data]);

  const getCellStyle = (count: number): React.CSSProperties => {
    if (count === -1) return { background: '#F8FAFC', border: '1px solid #F1F5F9', opacity: 0.4 }; // Future
    if (count === 0) return { background: '#F1F5F9', border: '1px solid #E2E8F0' };
    
    // Scale: Indigo to Violet gradient
    if (count === 1) return { background: '#E0E7FF', border: '1px solid #C7D2FE' };
    if (count === 2) return { background: '#818CF8', border: '1px solid #6366F1' };
    if (count === 3) return { background: '#6366F1', border: '1px solid #4F46E5' };
    if (count === 4) return { background: '#4F46E5', border: '1px solid #4338CA' };
    if (count === 5) return { background: '#7C3AED', border: '1px solid #6D28D9' };
    return               { background: '#5B21B6', border: '1px solid #4C1D95' };
  };

  const totalPractices = data?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const activeDays = data?.filter(d => d.count > 0).length || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Calendar size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 font-heading tracking-tight">Lịch sử học tập</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Theo dõi sự tiến bộ của bạn theo thời gian</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Cấp độ</span>
          <div className="flex gap-1.5 items-center">
            {[0, 1, 3, 6].map((v) => (
              <div 
                key={v}
                style={{ ...getCellStyle(v), width: 12, height: 12, borderRadius: 3 }}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-500 font-bold">Chăm chỉ</span>
        </div>
      </div>

      {/* ── Mini Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatMini
          icon={Flame}
          iconColor="#F59E0B"
          iconBg="#FFFBEB"
          label="Tổng lượt luyện"
          value={`${totalPractices}`}
          sub="Câu trả lời đã hoàn thành"
          delay={0.1}
        />
        <StatMini
          icon={Trophy}
          iconColor="#8B5CF6"
          iconBg="#F5F3FF"
          label="Ngày hoạt động"
          value={`${activeDays}`}
          sub="Trong 5 tháng gần nhất"
          delay={0.2}
        />
        <StatMini
          icon={Award}
          iconColor="#10B981"
          iconBg="#ECFDF5"
          label="Thành tích"
          value="Tiêu biểu"
          sub="85% so với học viên khác"
          delay={0.3}
        />
      </div>

      {/* ── Heatmap chart ── */}
      <div className="relative">
        {isLoading ? (
          <div className="flex gap-1.5 animate-pulse">
            {Array.from({ length: COLS }).map((_, c) => (
              <div key={c} className="flex flex-col gap-1.5">
                {Array.from({ length: ROWS }).map((_, r) => (
                  <div key={r} className="w-3.5 h-3.5 bg-slate-100 rounded-[3px]" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-2 min-w-max">
              {/* Day labels column */}
              <div className="flex flex-col gap-1.5 pt-7 pr-1">
                {DAY_LABELS.map((d, i) => (
                  <div
                    key={i}
                    className="h-3.5 text-[9px] font-bold text-slate-300 flex items-center justify-end w-5"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid columns */}
              <div className="flex-1 relative">
                {/* Month labels row */}
                <div className="flex h-6 relative mb-1">
                  {gridData.labels.map((ml) => (
                    <div
                      key={ml.col}
                      className="absolute text-[9px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap"
                      style={{ left: ml.col * 20 }}
                    >
                      {ml.text}
                    </div>
                  ))}
                </div>

                {/* Cell grid */}
                <div className="flex gap-[6px]">
                  {gridData.weeks.map((week, c) => (
                    <div key={c} className="flex flex-col gap-1.5">
                      {week.cells.map((cell, r) => (
                        <motion.div
                          key={r}
                          whileHover={{ scale: 1.25, zIndex: 10 }}
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 4,
                            cursor: cell.count >= 0 ? 'pointer' : 'default',
                            ...getCellStyle(cell.count),
                          }}
                          title={cell.count >= 0 ? `${cell.date.toLocaleDateString('vi-VN')}: ${cell.count} lượt` : ''}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Achievement CTA ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl flex items-center justify-between group cursor-pointer overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#4361EE,transparent)] opacity-20" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-indigo-300">
            <Trophy size={22} />
          </div>
          <div>
            <div className="text-sm font-black text-white font-heading">Sẵn sàng nâng tầm trình độ?</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Luyện tập thêm 2 bài hôm nay để duy trì streak!</div>
          </div>
        </div>
        <div className="bg-indigo-600 text-white p-2 rounded-lg group-hover:translate-x-1 transition-transform relative z-10">
          <ChevronRight size={18} />
        </div>
      </motion.div>
    </div>
  );
}

