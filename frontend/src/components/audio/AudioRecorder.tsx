import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onStreamUpdate?: (stream: MediaStream) => void;
  className?: string;
}

export function AudioRecorder({ 
  onRecordingComplete, 
  onStreamUpdate,
  className 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isError, setIsError] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      setIsError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Audio Analysis setup
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateVolume = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
        setVolume(average);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
      
      if (onStreamUpdate) {
        onStreamUpdate(stream);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        audioContext.close();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsError(true);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    setVolume(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pulse scale based on volume (0-255)
  const pulseScale = 1 + (volume / 255) * 1.5;

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="relative">
        <AnimatePresence>
          {isRecording && (
            <>
              {/* Outer Pulse */}
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: pulseScale * 1.2, 
                  opacity: (volume / 255) * 0.4 + 0.1 
                }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
              />
              {/* Inner Pulse */}
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: pulseScale, 
                  opacity: (volume / 255) * 0.6 + 0.2 
                }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute inset-0 bg-red-500/30 rounded-full blur-md"
              />
            </>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-500 shadow-2xl z-10",
            isRecording 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {isRecording ? (
            <motion.div
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
            >
              <Square className="w-10 h-10 text-white fill-current" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Mic className="w-10 h-10 text-white" />
            </motion.div>
          )}
        </motion.button>
      </div>

      <div className="text-center space-y-1">
        <motion.div 
          animate={isRecording ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          className={cn(
            "text-3xl font-mono font-bold tracking-widest transition-colors",
            isRecording ? "text-red-400" : "text-text-secondary"
          )}
        >
          {formatDuration(duration)}
        </motion.div>
        <div className="text-sm font-medium text-text-tertiary">
          {isRecording ? "Đang ghi âm..." : "Nhấn để bắt đầu"}
        </div>
      </div>

      {isError && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm font-medium bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20"
        >
          Không thể truy cập Microphone. Vui lòng kiểm tra cài đặt.
        </motion.div>
      )}
    </div>
  );
}
