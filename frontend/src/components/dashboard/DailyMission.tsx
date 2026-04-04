import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

interface DailyMissionProps {
  completedQuestions: number;
  totalQuestions: number;
  isLoading?: boolean;
}

export function DailyMission({ completedQuestions, totalQuestions, isLoading = false }: DailyMissionProps) {
  const percentage = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
  const remaining = Math.max(0, totalQuestions - completedQuestions);
  const isComplete = remaining === 0;

  return (
    <div className="glass-card p-6 flex flex-col justify-between space-y-4 hover-lift h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <CheckCircle2 className={`w-5 h-5 ${isComplete ? 'text-green-400' : 'text-primary'}`} />
          Nhiệm vụ hàng ngày
        </h3>
        <span className="text-xs font-bold text-text-secondary bg-white/5 py-1 px-3 rounded-full border border-white/5">
          {percentage}%
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary italic">
            Đã hoàn thành {completedQuestions}/{totalQuestions} câu hỏi
          </span>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg 
              ${isComplete ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-green-500/20' : 'bg-gradient-to-r from-primary to-indigo-500 shadow-primary/20'}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="text-sm text-text-secondary flex items-center gap-2 pt-2">
        {isComplete ? (
          <>
            <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-green-400 fill-current" />
            </div>
            <span className="font-medium text-white/90">Tuyệt vời! Bạn đã hoàn thành!</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Chỉ còn {remaining} câu nữa để đạt streak hôm nay!</span>
          </>
        )}
      </div>
    </div>
  );
}
