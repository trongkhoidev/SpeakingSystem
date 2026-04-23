import React from 'react';
import { TrendingUp, Calendar, Award, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestHistoryItem {
  id: string;
  createdAt: string;
  mode: string;
  overallBand: number;
  duration?: string;
}

interface TestPerformanceCardProps {
  test: TestHistoryItem;
  onClick?: () => void;
}

export function TestPerformanceCard({
  test,
  onClick,
}: TestPerformanceCardProps) {
  const bandColor = (band?: number) => {
    if (!band) return 'bg-gray-100 text-gray-700';
    if (band >= 7.5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (band >= 6.5) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (band >= 5.5) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-5 rounded-2xl border-2 transition-all text-left',
        'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md active:scale-95'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <p className="font-semibold text-gray-900">{test.mode}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(test.createdAt)}</span>
            {test.duration && (
              <>
                <Clock className="w-4 h-4" />
                <span>{test.duration}</span>
              </>
            )}
          </div>
        </div>

        {/* Right Score */}
        <div
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-xl border-2 text-center',
            bandColor(test.overallBand)
          )}
        >
          <p className="text-xs font-semibold text-gray-600 uppercase mb-0.5">
            Band
          </p>
          <p className="text-lg font-bold">{test.overallBand.toFixed(1)}</p>
        </div>
      </div>
    </button>
  );
}
