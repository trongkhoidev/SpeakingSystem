import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface WaveformVisualizerProps {
  stream: MediaStream | null;
  className?: string;
  isRecording?: boolean;
}

export function WaveformVisualizer({ 
  stream, 
  className, 
  isRecording = false 
}: WaveformVisualizerProps) {
  const [waveformData, setWaveformData] = useState<number[]>(new Array(64).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!stream || !isRecording) {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      setWaveformData(new Array(64).fill(0));
      return;
    }

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Downsample to 64 bars for visualization
        const samples = [];
        const step = Math.floor(bufferLength / 64);
        for (let i = 0; i < 64; i++) {
          const value = dataArray[i * step] / 255;
          samples.push(value);
        }
        
        setWaveformData(samples);
        animationIdRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (err) {
      console.error("Failed to setup audio visualization:", err);
    }

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, isRecording]);

  return (
    <div className={cn("flex items-center justify-center gap-[4px] h-32 md:h-48 w-full px-4", className)}>
      {!isRecording ? (
        <div className="flex flex-col items-center gap-4 text-text-tertiary/40">
          <Activity className="w-12 h-12" />
          <span className="text-sm font-bold uppercase tracking-widest">Sẵn sàng thu âm</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-[4px] w-full">
          {waveformData.map((value, i) => (
            <div
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-all duration-75",
                value > 0.5 ? "bg-red-400" : value > 0.2 ? "bg-primary" : "bg-primary/40"
              )}
              style={{
                height: `${Math.max(4, value * 100)}%`,
                opacity: 0.6 + (value * 0.4)
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
