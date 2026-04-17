import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Mic } from 'lucide-react';

interface WaveformVisualizerProps {
  stream: MediaStream | null;
  className?: string;
  isRecording?: boolean;
}

export function WaveformVisualizer({ stream, className, isRecording = false }: WaveformVisualizerProps) {
  const [waveformData, setWaveformData] = useState<number[]>(new Array(48).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const animationIdRef  = useRef<number>();

  useEffect(() => {
    if (!stream || !isRecording) {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      setWaveformData(new Array(48).fill(0));
      return;
    }
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const step = Math.floor(bufferLength / 48);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const samples = Array.from({ length: 48 }, (_, i) => dataArray[i * step] / 255);
        setWaveformData(samples);
        animationIdRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error('Audio viz error:', err);
    }
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, isRecording]);

  const BARS = 48;

  /* Idle state */
  if (!isRecording) {
    return (
      <div className={cn('flex flex-col items-center gap-4 py-4', className)}>
        <div className="flex items-end justify-center gap-[4px] h-16">
          {Array.from({ length: BARS }).map((_, i) => {
            const phase = (i / BARS) * Math.PI * 2;
            const h = 8 + Math.sin(phase) * 6;
            return (
              <div
                key={i}
                className="waveform-bar waveform-bar--idle"
                style={{
                  height: `${h}px`,
                  animationDelay: `${(i / BARS) * 1.4}s`,
                  animationDuration: `${1.2 + Math.abs(Math.sin(i)) * 0.5}s`,
                }}
              />
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: 'var(--primary-bg)' }}
          >
            <Mic className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Nhấn nút mic để bắt đầu ghi âm
          </span>
        </div>
      </div>
    );
  }

  /* Recording state */
  return (
    <div className={cn('flex flex-col items-center gap-3 w-full', className)}>
      {/* Live chip */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Đang ghi âm...
      </div>

      {/* Bars */}
      <div className="flex items-end justify-center gap-[3px] h-20 w-full px-4">
        {waveformData.map((value, i) => {
          const height = Math.max(4, value * 100);
          const isHigh = value > 0.6;
          const isMid  = value > 0.28;
          return (
            <div
              key={i}
              className={cn(
                'waveform-bar',
                isHigh ? 'waveform-bar--active-high'
                : isMid ? 'waveform-bar--active-mid'
                : 'waveform-bar--active-low'
              )}
              style={{ height: `${height}%`, opacity: 0.6 + value * 0.4 }}
            />
          );
        })}
      </div>
    </div>
  );
}
