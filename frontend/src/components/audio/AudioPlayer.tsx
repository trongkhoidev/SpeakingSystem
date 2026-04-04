import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/Slider';

interface AudioPlayerProps {
  src?: string;
  className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
      
      audioRef.current.ontimeupdate = () => {
        setProgress(audioRef.current?.currentTime || 0);
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
    }
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!src) return null;

  return (
    <div className={cn("p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-8 glass-card", className)}>
      <div className="flex items-center justify-between ml-1">
        <div className="flex items-center gap-3 text-white/40 font-black tracking-widest text-[11px] uppercase">
          <span className="w-8 h-[1px] bg-white/20" />
          Review Recording
        </div>
        <div className="p-2 rounded-xl bg-white/5 text-white/20">
          <Music className="w-5 h-5" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10">
        <button 
          onClick={togglePlay}
          className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white shadow-2xl shadow-primary/20 transition-all hover-lift active:scale-95 group"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 fill-current group-hover:scale-110 transition-transform" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1 group-hover:scale-110 transition-transform" />
          )}
        </button>

        <div className="flex-1 space-y-6 w-full">
          <div className="flex items-center justify-between text-xs font-black tracking-widest text-white/40 uppercase">
            <span>{formatTime(progress)}</span>
            <div className="flex items-center gap-2 group cursor-pointer hover:text-white transition-all">
              <RotateCcw className="w-3 h-3 group-hover:-rotate-45 transition-transform" />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <Slider 
            value={[progress]} 
            max={duration || 100} 
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-4 text-white/20 hover:text-white/40 transition-colors cursor-pointer group">
          <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <audio ref={audioRef} src={src} className="hidden" />
    </div>
  );
}
