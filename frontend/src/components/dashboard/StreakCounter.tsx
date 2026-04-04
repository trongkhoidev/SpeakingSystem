import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  isLoading?: boolean;
}

export function StreakCounter({ currentStreak, isLoading = false }: StreakCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setCount(currentStreak);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, isLoading]);

  return (
    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover-lift transition-all">
      <div className="p-3 bg-primary/20 rounded-2xl shadow-inner-white">
        <Flame 
          className={`w-7 h-7 text-primary ${count > 0 ? 'animate-pulse' : ''}`} 
          fill={count > 0 ? 'currentColor' : 'none'} 
        />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white tracking-tight transition-all duration-700">
            {count}
          </span>
          <span className="text-sm font-medium text-text-secondary">ngày</span>
        </div>
        <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          Chuỗi học tập
        </div>
      </div>
    </div>
  );
}
