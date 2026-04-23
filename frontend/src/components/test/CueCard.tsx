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
      "card p-10 border-[#E8ECF1] bg-white shadow-xl relative overflow-hidden group",
      className
    )}>
      {/* Background Decorative Element */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#EEF0FD] rounded-full blur-3xl group-hover:bg-[#E0E7FF] transition-all duration-700"></div>
      
      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#4361EE] text-[11px] font-bold uppercase tracking-wider">
            <span className="w-8 h-[2px] bg-[#4361EE] rounded-full"></span>
            IELTS Speaking Part 2
          </div>
          <h3 className="text-2xl md:text-3xl font-bold font-heading text-[#1A1D2B] leading-tight">
            {topic}
          </h3>
        </div>

        {/* Bullets */}
        <div className="space-y-4">
          <p className="text-[14px] text-[#6B7280] font-medium italic">You should say:</p>
          <ul className="space-y-4">
            {bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-4 group/item">
                <div className="w-6 h-6 rounded-lg bg-[#F8F9FB] border border-[#E8ECF1] flex items-center justify-center text-[#4361EE] font-bold text-[11px] shrink-0 mt-0.5 group-hover/item:bg-[#4361EE] group-hover/item:text-white transition-all">
                  {index + 1}
                </div>
                <span className="text-[17px] text-[#1A1D2B] font-medium group-hover/item:text-[#4361EE] transition-colors">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-[#E8ECF1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[#6B7280] text-[13px]">
            <div className="p-2 bg-[#EEF0FD] rounded-lg">
              <Clock className="w-4 h-4 text-[#4361EE]" />
            </div>
            <span>
              Preparation: <span className="text-[#1A1D2B] font-bold">{preparationTime}s</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FB] rounded-full text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            Explain your answer in detail
          </div>
        </div>
      </div>
    </div>
  );
}
