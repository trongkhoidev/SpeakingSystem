import React from 'react';
import { Calendar } from 'lucide-react';

interface ActivityDay {
  date: string;
  count: number;
}

interface ContributionHeatmapProps {
  data: ActivityDay[];
  isLoading?: boolean;
}

export function ContributionHeatmap({ data, isLoading = false }: ContributionHeatmapProps) {
  // Generate last 5 months of dates
  const generateMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('vi-VN', { month: 'short' }));
    }
    return months;
  };

  const months = generateMonths();
  
  // Helper to get color based on count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/[0.03] border-white/[0.02]';
    if (count < 2) return 'bg-primary/20 border-primary/10';
    if (count < 4) return 'bg-primary/40 border-primary/20';
    if (count < 6) return 'bg-primary/70 border-primary/30';
    return 'bg-primary border-primary/40';
  };

  return (
    <div className="glass-card p-8 hover-lift w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h3 className="font-semibold text-xl text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Lịch sử học tập
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium uppercase tracking-wider">
           <span>Less</span>
           <div className="flex gap-1.5 mx-1">
             <div className="w-3.5 h-3.5 rounded-[3px] bg-white/[0.03] border border-white/[0.02]" title="No activity" />
             <div className="w-3.5 h-3.5 rounded-[3px] bg-primary/20 border border-primary/10" title="Low activity" />
             <div className="w-3.5 h-3.5 rounded-[3px] bg-primary/40 border border-primary/20" title="Medium activity" />
             <div className="w-3.5 h-3.5 rounded-[3px] bg-primary/70 border border-primary/30" title="High activity" />
             <div className="w-3.5 h-3.5 rounded-[3px] bg-primary border border-primary/40" title="Maximum activity" />
           </div>
           <span>More</span>
        </div>
      </div>

      <div className="relative">
        {/* Month Labels */}
        <div className="flex justify-between mb-3 text-[11px] font-bold text-text-secondary pr-4 pl-8">
          {months.map((m, i) => (
            <span key={i} className="flex-1 text-center">{m}</span>
          ))}
        </div>

        <div className="flex gap-3">
          {/* Day Labels */}
          <div className="flex flex-col justify-between text-[9px] font-bold text-text-secondary py-1 w-6 shrink-0 opacity-50 uppercase tracking-tighter">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-[repeat(22,1fr)] gap-1.5 h-28">
            {isLoading ? (
              Array.from({ length: 154 }).map((_, i) => (
                <div key={i} className="w-full h-full rounded-[3px] bg-white/[0.02] animate-pulse" />
              ))
            ) : (
              // Random data for preview if none provided
              Array.from({ length: 154 }).map((_, i) => {
                const count = data.length > 0 ? (data[i]?.count || 0) : Math.floor(Math.random() * 5);
                return (
                  <div 
                    key={i} 
                    className={`aspect-square w-full rounded-[3px] border transition-colors duration-500 cursor-help ${getColor(count)}`} 
                    title={`${count} contributions on Day ${i}`}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
         <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
         </div>
         <div>
            <div className="text-sm font-bold text-white">Thành tích nổi bật</div>
            <div className="text-xs text-text-secondary">Bạn đã học tập tích cực hơn 85% học viên khác trong tháng qua!</div>
         </div>
      </div>
    </div>
  );
}
