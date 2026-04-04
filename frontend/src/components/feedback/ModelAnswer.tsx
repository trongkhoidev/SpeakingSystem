import { Sparkles, Quote, ArrowRightCircle } from 'lucide-react';
import { Button } from '../shared/Button';

interface ModelAnswerProps {
  answer: string;
}

export function ModelAnswer({ answer }: ModelAnswerProps) {
  return (
    <div className="space-y-10 group">
      <div className="flex items-center gap-3 text-indigo-400 font-black tracking-widest text-[11px] uppercase ml-1">
        <span className="w-8 h-[1px] bg-indigo-500/40" />
        AI Optimized Model Answer
      </div>

      <div className="relative p-14 rounded-[3.5rem] bg-gradient-to-br from-indigo-500/15 via-indigo-500/[0.05] to-transparent border border-indigo-500/20 glass-card group-hover:bg-indigo-500/[0.08] transition-all duration-1000 overflow-hidden perspective-1000">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
          <Quote className="w-24 h-24 text-indigo-400 rotate-180" />
        </div>
        
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]" />
        
        <div className="relative space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-2xl font-black text-white italic tracking-tight font-heading">
              How an Expert would say it...
            </h4>
          </div>

          <div className="space-y-8">
            <p className="text-xl md:text-2xl font-medium text-white/90 leading-loose italic underline-offset-[12px] decoration-indigo-500/20 decoration-2 transition-all">
              {answer}
            </p>
            
            <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-indigo-500/10">
              <div className="flex-1 space-y-3">
                <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Why it works</h5>
                <p className="text-sm font-bold text-white/40 leading-relaxed max-w-md">
                  Sử dụng cấu trúc AREA và từ nối Signposting giúp bài nói mạch lạc và phong phú về từ vựng (C1/C2).
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button variant="ghost" className="rounded-2xl py-6 px-8 bg-white/5 border border-white/5 text-xs font-black tracking-widest text-white/60 hover:bg-white/[0.08] hover:text-white transition-all uppercase flex items-center gap-3">
                  Read aloud (TTS)
                  <ArrowRightCircle className="w-4 h-4 text-indigo-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
