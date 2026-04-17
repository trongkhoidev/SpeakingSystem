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
      const timer = setTimeout(() => setCount(currentStreak), 300);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, isLoading]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover-lift"
      style={{
        background: '#FFF7E6',
        border: '1px solid #FDDFA0',
      }}
    >
      <div
        className="p-2.5 rounded-xl"
        style={{ background: '#FFE8A0' }}
      >
        <Flame
          className={`w-5 h-5 ${count > 0 ? 'animate-pulse' : ''}`}
          style={{ color: '#E2940A' }}
          fill={count > 0 ? 'currentColor' : 'none'}
        />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {count}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>ngày</span>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
          Chuỗi học tập
        </div>
      </div>
    </div>
  );
}
