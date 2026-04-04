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

export function ForecastProgress({ progress, isLoading = false }: ForecastProgressProps) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between space-y-6 hover-lift h-full border-t-2 border-indigo-400/20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Tiến độ Forecast
        </h3>
        <span className="text-[10px] font-bold text-text-secondary bg-white/5 py-1 px-3 rounded-full border border-white/5 uppercase tracking-wider">
          Quý 1, 2026
        </span>
      </div>

      <div className="space-y-6">
        {progress.map((p, index) => {
          const percentage = (p.completed / p.total) * 100;
          return (
            <div key={index} className="space-y-2 group">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                    {p.part}
                  </span>
                  <div className="text-[10px] text-text-secondary font-semibold uppercase opacity-60">Chủ đề hoàn thành</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white tracking-widest">{p.completed}</span>
                  <span className="text-xs text-text-secondary">/{p.total}</span>
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(0,0,0,0.5)] ${p.color}`} 
                  style={{ width: `${percentage}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button className="w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-text-secondary hover:bg-white/10 hover:text-white hover:border-white/10 transition-all uppercase tracking-widest">
           Xem chi tiết lộ trình
        </button>
      </div>
    </div>
  );
}
