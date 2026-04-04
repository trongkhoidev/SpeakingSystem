import React from 'react';
import { cn } from '../../lib/utils';

interface BandBadgeProps {
  score: number | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BandBadge({ score, size = 'md', className }: BandBadgeProps) {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  
  const getColorClass = (s: number) => {
    if (s >= 7.5) return 'from-green-500 to-emerald-600 shadow-green-500/20';
    if (s >= 6.5) return 'from-blue-500 to-indigo-600 shadow-blue-500/20';
    if (s >= 5.5) return 'from-amber-500 to-orange-600 shadow-amber-500/20';
    return 'from-red-500 to-rose-600 shadow-red-500/20';
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm border-2',
    md: 'w-14 h-14 text-lg border-[3px]',
    lg: 'w-20 h-20 text-2xl border-[4px]',
  };

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-bold text-white shadow-lg bg-gradient-to-br border-white/20",
      getColorClass(numericScore),
      sizeClasses[size],
      className
    )}>
      {score}
    </div>
  );
}
