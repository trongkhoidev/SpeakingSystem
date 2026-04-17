import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface LiveTranscriptProps {
  interimText: string;
  finalText: string;
  className?: string;
}

export function LiveTranscript({ interimText, finalText, className }: LiveTranscriptProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl p-4 min-h-[100px] max-h-[180px] overflow-y-auto custom-scrollbar relative',
        className
      )}
      style={{
        background: 'var(--bg-body)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="absolute top-3.5 left-3.5" style={{ color: 'var(--primary)', opacity: 0.4 }}>
        <MessageSquare className="w-4 h-4" />
      </div>

      <div className="pl-8 space-y-1">
        {!finalText && !interimText && (
          <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
            Văn bản sẽ hiện ở đây khi bạn nói...
          </p>
        )}

        <p className="text-base font-medium leading-relaxed">
          <span style={{ color: 'var(--text-primary)' }}>{finalText}</span>
          <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{interimText}</span>
        </p>
      </div>
    </div>
  );
}
