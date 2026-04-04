import { cn } from '@/lib/utils';
import { 
  Check, 
  Wind, 
  Activity, 
  Zap, 
  Monitor, 
  Smile, 
  BookOpen, 
  GraduationCap 
} from 'lucide-react';

interface AzureDashboardProps {
  results: {
    accuracy_score: number;
    fluency_score: number;
    prosody_score: number;
    completeness_score: number;
    pronunciation_score: number;
  };
  bandScores: {
    FC: number;
    LR: number;
    GRA: number;
    PRON: number;
  };
}

export function AzureDashboard({ results, bandScores }: AzureDashboardProps) {
  const metrics = [
    { label: "Fluency & Coherence", score: bandScores.FC, icon: Wind, color: "from-blue-500/20 to-blue-400/5", border: "border-blue-500/30", text: "text-blue-400" },
    { label: "Lexical Resource", score: bandScores.LR, icon: BookOpen, color: "from-indigo-500/20 to-indigo-400/5", border: "border-indigo-500/30", text: "text-indigo-400" },
    { label: "Grammatical Accuracy", score: bandScores.GRA, icon: GraduationCap, color: "from-purple-500/20 to-purple-400/5", border: "border-purple-500/30", text: "text-purple-400" },
    { label: "Pronunciation", score: bandScores.PRON, icon: Smile, color: "from-emerald-500/20 to-emerald-400/5", border: "border-emerald-500/30", text: "text-emerald-400" }
  ];

  const azureMetrics = [
    { label: "Accuracy", value: results.accuracy_score, icon: Check, barColor: "bg-emerald-400" },
    { label: "Fluency", value: results.fluency_score, icon: Activity, barColor: "bg-blue-400" },
    { label: "Prosody", value: results.prosody_score, icon: Zap, barColor: "bg-amber-400" },
    { label: "Completeness", value: results.completeness_score, icon: Monitor, barColor: "bg-indigo-400" }
  ];

  return (
    <div className="space-y-12">
      {/* 4 Core Band Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div 
            key={i} 
            className={cn(
              "p-6 rounded-3xl border backdrop-blur-md transition-all duration-500 hover-lift bg-gradient-to-br",
              m.color,
              m.border
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-white/10">
                <m.icon className={cn("w-5 h-5", m.text)} />
              </div>
              <div className={cn("text-2xl font-black", m.text)}>{m.score.toFixed(1)}</div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/50">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Azure Detailed Metrics */}
      <div className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-8 glass-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/40 font-black tracking-widest text-[11px] uppercase">
            <span className="w-8 h-[1px] bg-white/20" />
            Azure Acoustic Metrics
          </div>
          <span className="text-xl font-black text-white/80 drop-shadow-sm">{results.pronunciation_score.toFixed(0)}%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {azureMetrics.map((m, i) => (
            <div key={i} className="space-y-4 group">
              <div className="flex items-center justify-between font-bold text-sm tracking-tight text-white/60">
                <div className="flex items-center gap-3">
                  <m.icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span>{m.label}</span>
                </div>
                <span className="text-white font-black">{m.value.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", m.barColor)} 
                  style={{ width: `${m.value}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
