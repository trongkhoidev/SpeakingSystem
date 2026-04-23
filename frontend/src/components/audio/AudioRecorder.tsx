import { useEffect, useCallback } from 'react';
import { Mic, Square, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onStreamUpdate?: (stream: MediaStream) => void;
  className?: string;
  disabled?: boolean;
}

export function AudioRecorder({ 
  onRecordingComplete, 
  onStreamUpdate,
  className,
  disabled = false
}: AudioRecorderProps) {
  const {
    isRecording,
    duration,
    isError,
    volume,
    startRecording,
    stopRecording,
    formatDuration
  } = useMediaRecorder({
    onRecordingComplete,
    onStreamUpdate
  });

  const toggleRecording = useCallback(() => {
    if (disabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording, disabled]);

  // Keyboard shortcut: Space bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !disabled) {
        // Prevent scrolling when pressing space
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          toggleRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRecording, disabled]);

  // Pulse scale based on volume (0-255)
  const pulseScale = 1 + (volume / 255) * 1.5;

  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      <div className="relative">
        <AnimatePresence mode="wait">
          {isRecording && (
            <>
              {/* Ultra-realistic Pulse Effects */}
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: pulseScale * 1.4, 
                  opacity: (volume / 255) * 0.3 + 0.05 
                }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
                className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl"
              />
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: pulseScale * 1.1, 
                  opacity: (volume / 255) * 0.5 + 0.1 
                }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
              />
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: pulseScale, 
                  opacity: (volume / 255) * 0.7 + 0.2 
                }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute inset-0 bg-red-400/30 rounded-full blur-md"
              />
            </>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          onClick={toggleRecording}
          disabled={disabled}
          className={cn(
            "relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] z-10",
            disabled ? "bg-gray-200 cursor-not-allowed" :
            isRecording 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/40" 
              : "bg-primary hover:bg-primary/90 shadow-primary/40"
          )}
        >
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="stop"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Square className="w-12 h-12 text-white fill-current" />
              </motion.div>
            ) : (
              <motion.div
                key="start"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Mic className="w-12 h-12 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center space-y-1">
          <motion.div 
            animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "text-4xl font-mono font-bold tracking-widest transition-colors",
              isRecording ? "text-red-500" : "text-text-primary"
            )}
          >
            {formatDuration(duration)}
          </motion.div>
          <div className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            {isRecording ? "Đang ghi âm..." : "Sẵn sàng"}
          </div>
        </div>

        {/* Keyboard Hint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/50 border border-slate-200/50 backdrop-blur-sm"
        >
          <Keyboard className="w-4 h-4 text-text-tertiary" />
          <span className="text-xs font-medium text-text-tertiary uppercase">
            Nhấn <kbd className="font-mono bg-white border border-slate-300 rounded px-1 shadow-sm text-text-secondary">SPACE</kbd> để {isRecording ? 'dừng' : 'bắt đầu'}
          </span>
        </motion.div>
      </div>

      {isError && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm font-medium bg-red-50 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Không thể truy cập Microphone. Vui lòng kiểm tra quyền truy cập.
        </motion.div>
      )}
    </div>
  );
}
