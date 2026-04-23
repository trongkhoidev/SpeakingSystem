import { useEffect, useState } from 'react';
import { Shield, Mic2, Brain, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  {
    id: 'gatekeeper',
    label: 'Xác thực nội dung',
    description: 'Đang kiểm tra chất lượng câu trả lời...',
    icon: Shield,
    color: '#4361EE',
    bg: '#EEF0FD',
  },
  {
    id: 'azure',
    label: 'Phân tích âm học',
    description: 'Azure AI đang chấm điểm phát âm...',
    icon: Mic2,
    color: '#22A06B',
    bg: '#E6F9F0',
  },
  {
    id: 'llm',
    label: 'Đánh giá ngôn ngữ',
    description: 'AI đang phân tích ngữ pháp và từ vựng...',
    icon: Brain,
    color: '#7C3AED',
    bg: '#F3F0FF',
  },
];

export function AssessmentLoading() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const stage = STAGES[currentStage];

  return (
    <div className="flex flex-col items-center justify-center py-14 gap-8 text-center">
      {/* Central spinner */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="orbit-ring" />
        <div className="orbit-ring-2" />

        <div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500"
          style={{ background: stage.bg, border: `1px solid ${stage.color}30` }}
        >
          <div key={currentStage} className="animate-scale-in" style={{ color: stage.color }}>
            <stage.icon className="w-9 h-9" />
          </div>
        </div>
      </div>

      {/* Text */}
      <div key={`text-${currentStage}`} className="animate-fade-up space-y-2 max-w-xs">
        <h3 className="text-xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
          {stage.label}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {stage.description}
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="ai-dot" />
          <div className="ai-dot" />
          <div className="ai-dot" />
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              height: 4,
              width: i === currentStage ? 28 : 10,
              background: i <= currentStage ? stage.color : 'var(--border-light)',
            }}
          />
        ))}
      </div>

      {/* Stage checklist */}
      <div className="w-full max-w-xs space-y-2">
        {STAGES.map((s, i) => {
          const isDone    = i < currentStage;
          const isCurrent = i === currentStage;
          return (
            <div
              key={s.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-400',
                isCurrent && 'scale-[1.02]'
              )}
              style={{
                background: isCurrent ? s.bg : isDone ? '#E6F9F0' : 'var(--bg-body)',
                borderColor: isCurrent ? `${s.color}40` : isDone ? '#22A06B30' : 'var(--border-light)',
                opacity: i > currentStage ? 0.4 : 1,
              }}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isDone ? '#E6F9F0' : isCurrent ? s.bg : 'var(--bg-card)',
                  color: isDone ? '#22A06B' : isCurrent ? s.color : 'var(--text-muted)',
                }}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <div
                    className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: s.color }}
                  />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
              </div>

              {/* Label */}
              <div className="text-left flex-1">
                <p
                  className="text-xs font-semibold"
                  style={{ color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                >
                  {s.label}
                </p>
                {isCurrent && (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Đang xử lý...
                  </p>
                )}
              </div>

              {isDone && (
                <span className="badge badge--success text-[9px]">Xong</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
