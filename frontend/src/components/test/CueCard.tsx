import { Clock, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CueCardProps {
  topic: string;
  bullets: string[];
  preparationTime?: number; // in seconds
  className?: string;
}

export function CueCard({ topic, bullets, preparationTime = 60, className }: CueCardProps) {
  return (
    <div className={cn(
      "glass-card p-10 border-2 border-primary/20 bg-gradient-to-br from-white/[0.03] to-primary/5 shadow-2xl relative overflow-hidden group",
      className
    )}>
      {/* Background Decorative Element */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
      
      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
            <span className="w-8 h-[2px] bg-primary rounded-full"></span>
            IELTS Speaking Part 2
          </div>
          <h3 className="text-2xl md:text-3xl font-black font-heading text-white leading-tight">
            {topic}
          </h3>
        </div>

        {/* Bullets */}
        <div className="space-y-4">
          <p className="text-text-secondary font-medium italic">You should say:</p>
          <ul className="space-y-4">
            {bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-4 group/item">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5 group-hover/item:bg-primary group-hover/item:text-white transition-all">
                  {index + 1}
                </div>
                <span className="text-lg text-white/90 font-medium group-hover/item:text-white transition-colors">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-text-secondary text-sm">
            <div className="p-2 bg-white/5 rounded-lg">
              <Clock className="w-4 h-4 text-secondary" />
            </div>
            <span>
              Preparation: <span className="text-white font-bold">{preparationTime}s</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[11px] font-bold text-text-muted uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            Explain your answer in detail
          </div>
        </div>
      </div>
    </div>
  );
}
