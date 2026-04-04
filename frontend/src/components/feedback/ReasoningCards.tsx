import { useState } from 'react';
import { 
  ChevronDown, 
  Wind, 
  BookOpen, 
  GraduationCap, 
  HelpCircle,
  Sparkles,
  ArrowRightCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../shared/Button';

interface ReasoningCardsProps {
  feedback: {
    FC: { score: number; feedback: string; key_findings: string[] };
    LR: { score: number; feedback: string; band_8_plus_words: string[] };
    GRA: { score: number; feedback: string; error_types: string[]; complexity: string };
  };
}

export function ReasoningCards({ feedback }: ReasoningCardsProps) {
  const [expanded, setExpanded] = useState<string | null>('FC');

  const cards = [
    { 
      id: 'FC', 
      label: 'Fluency & Coherence', 
      icon: Wind, 
      color: "from-blue-500/20 to-blue-400/5", 
      border: "border-blue-500/30", 
      text: "text-blue-400",
      content: feedback.FC.feedback,
      bullets: feedback.FC.key_findings,
      bulletTitle: "Key Findings"
    },
    { 
      id: 'LR', 
      label: 'Lexical Resource', 
      icon: BookOpen, 
      color: "from-indigo-500/20 to-indigo-400/5", 
      border: "border-indigo-500/30", 
      text: "text-indigo-400",
      content: feedback.LR.feedback,
      bullets: feedback.LR.band_8_plus_words,
      bulletTitle: "Advanced Vocabulary"
    },
    { 
      id: 'GRA', 
      label: 'Grammatical Accuracy', 
      icon: GraduationCap, 
      color: "from-purple-500/20 to-purple-400/5", 
      border: "border-purple-500/30", 
      text: "text-purple-400",
      content: feedback.GRA.feedback,
      bullets: feedback.GRA.error_types,
      bulletTitle: "Key Error Areas"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-white/40 font-black tracking-widest text-[11px] uppercase ml-1">
        <span className="w-8 h-[1px] bg-white/20" />
        AI Linguistic Insights
      </div>
      
      {cards.map((c, i) => (
        <div 
          key={i} 
          className={cn(
            "rounded-[2rem] border overflow-hidden transition-all duration-500 group bg-gradient-to-br",
            c.color,
            c.border,
            expanded === c.id ? "ring-2 ring-white/10" : "hover:bg-white/5"
          )}
        >
          <button 
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            className="w-full px-8 py-10 flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-6">
              <div className={cn("p-4 rounded-[1.25rem] bg-white/10 group-hover:scale-110 transition-transform", c.text)}>
                <c.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black text-white tracking-tight">{c.label}</h4>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={cn("flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm font-black border border-white/5", c.text)}>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Deeply
              </span>
              <ChevronDown className={cn(
                "w-6 h-6 text-white/40 transition-transform duration-500",
                expanded === c.id ? "rotate-180" : ""
              )} />
            </div>
          </button>

          <div className={cn(
            "transition-all duration-700 ease-in-out",
            expanded === c.id ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="px-10 pb-10 pt-2 space-y-10">
              <div className="h-[1px] w-full bg-white/5" />
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                    <ArrowRightCircle className="w-4 h-4 text-white/20" />
                    Examiner Feedback
                  </h5>
                  <p className="text-white/80 text-lg leading-relaxed font-medium">
                    {c.content}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {c.bullets && c.bullets.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-black uppercase text-white/30 tracking-widest">{c.bulletTitle}</h5>
                      <div className="flex flex-wrap gap-2.5">
                        {c.bullets.map((b, bi) => (
                          <span 
                            key={bi} 
                            className="px-4 py-2 rounded-xl bg-white/5 text-[13px] font-bold text-white/80 border border-white/5 hover:border-white/10 transition-all cursor-default"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-6 flex flex-col justify-between">
                    <div>
                      <h5 className="text-[11px] font-black uppercase text-secondary/60 tracking-widest mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-secondary/40" />
                        Need more help?
                      </h5>
                      <p className="text-white/40 text-sm font-bold leading-relaxed">
                        Hãy để AI giải thích chi tiết hơn về tiêu chí này và cách bạn có thể cải thiện điểm số.
                      </p>
                    </div>
                    <Button variant="ghost" className="w-full justify-between items-center text-secondary border-none hover:bg-white/5 py-6 px-6 font-black tracking-widest text-xs rounded-2xl group/btn">
                      EXPLAIN MORE
                      <ArrowRightCircle className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
