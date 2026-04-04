import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface LiveTranscriptProps {
  interimText: string;
  finalText: string;
  className?: string;
}

export function LiveTranscript({ interimText, finalText, className }: LiveTranscriptProps) {
  return (
    <div className={cn(
      "w-full bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[120px] max-h-[200px] overflow-y-auto custom-scrollbar relative",
      className
    )}>
      <div className="absolute top-4 left-4 text-primary/40">
        <MessageSquare className="w-5 h-5" />
      </div>
      
      <div className="pl-10 space-y-2">
        {!finalText && !interimText && (
          <p className="text-text-tertiary italic animate-pulse">
            Sẽ hiện ở đây khi bạn nói...
          </p>
        )}
        
        <p className="inline-block text-lg font-medium leading-relaxed">
          <span className="text-white drop-shadow-sm">{finalText}</span>
          <span className="text-text-tertiary ml-1.5">{interimText}</span>
        </p>
      </div>
      
      {/* Decorative gradient at bottom to show more content exists */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}
