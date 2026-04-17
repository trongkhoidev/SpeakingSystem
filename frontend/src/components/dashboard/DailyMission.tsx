import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

interface DailyMissionProps {
  completedQuestions: number;
  totalQuestions: number;
  isLoading?: boolean;
}

export function DailyMission({ completedQuestions, totalQuestions, isLoading = false }: DailyMissionProps) {
  const percentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  const remaining  = Math.max(0, totalQuestions - completedQuestions);
  const isComplete = remaining === 0;

  return (
    <div className="card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CheckCircle2
            className="w-4 h-4"
            style={{ color: isComplete ? 'var(--success)' : 'var(--primary)' }}
          />
          Nhiệm vụ hàng ngày
        </h3>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: isComplete ? 'var(--success-bg)' : 'var(--primary-bg)',
            color: isComplete ? 'var(--success)' : 'var(--primary-text)',
          }}
        >
          {percentage}%
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Đã hoàn thành {completedQuestions}/{totalQuestions} câu hỏi
        </p>
        <div className="progress-bar">
          <div
            className="progress-bar__fill transition-all duration-1000"
            style={{
              width: `${percentage}%`,
              background: isComplete ? 'var(--success)' : 'var(--primary)',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs mt-auto" style={{ color: 'var(--text-secondary)' }}>
        {isComplete ? (
          <>
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--success-bg)' }}>
              <Zap className="w-3 h-3" style={{ color: 'var(--success)' }} fill="currentColor" />
            </div>
            <span className="font-semibold" style={{ color: 'var(--success)' }}>Tuyệt vời! Bạn đã hoàn thành!</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
            <span>Còn {remaining} câu để đạt mục tiêu hôm nay!</span>
          </>
        )}
      </div>
    </div>
  );
}
