import { cn } from '@/lib/utils';
import { MessageSquare, Loader2, Radio, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveTranscriptProps {
  interimText: string;
  finalText: string;
  status?: 'idle' | 'connecting' | 'listening' | 'failed' | 'closed' | 'unsupported';
  isFallback?: boolean;
  className?: string;
}

export function LiveTranscript({ 
  interimText, 
  finalText, 
  status = 'idle',
  isFallback = false,
  className 
}: LiveTranscriptProps) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl p-5 min-h-[120px] max-h-[200px] overflow-y-auto custom-scrollbar relative transition-all duration-300',
        status === 'listening' ? 'border-primary/30 ring-1 ring-primary/10' : 'border-slate-200',
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <MessageSquare className="w-4 h-4 opacity-70" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Nhận dạng giọng nói</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {status === 'connecting' && (
              <motion.div 
                key="connecting"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-amber-500"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-bold uppercase">Đang kết nối</span>
              </motion.div>
            )}
            {status === 'listening' && (
              <motion.div 
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-emerald-500"
              >
                <Radio className="w-3 h-3 animate-pulse" />
                <span className="text-[10px] font-bold uppercase">Sẵn sàng</span>
              </motion.div>
            )}
            {status === 'failed' && (
              <motion.div 
                key="failed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-red-500"
              >
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase">Lỗi kết nối</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isFallback && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-tighter"
            >
              Fallback Active
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {!finalText && !interimText ? (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="text-sm italic font-medium leading-relaxed" 
            style={{ color: 'var(--text-muted)' }}
          >
            Văn bản sẽ hiện ở đây khi bạn nói...
          </motion.p>
        ) : (
          <p className="text-base font-medium leading-relaxed font-heading">
            <span style={{ color: 'var(--text-primary)' }}>{finalText}</span>
            <AnimatePresence mode="popLayout">
              {interimText && (
                <motion.span 
                  key="interim"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="ml-1 inline-block" 
                  style={{ color: 'var(--primary)', opacity: 0.6 }}
                >
                  {interimText}
                </motion.span>
              )}
            </AnimatePresence>
          </p>
        )}
      </div>
      
      {/* Decorative gradient corner */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-primary/5 rounded-br-2xl pointer-events-none" />
    </div>
  );
}
