import { 
  Award, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  FileText, 
  MessageCircle, 
  Share2,
  TrendingUp,
  Zap,
  Play
} from 'lucide-react';
import { useState } from 'react';
import { BandBadge } from '../shared/BandBadge';
import { Button } from '../shared/Button';
import { cn } from '../../lib/utils';

interface QuestionResult {
  id: string;
  question: string;
  part: number;
  overall_band: number;
  scores: {
    fc: number;
    lr: number;
    gra: number;
    pron: number;
  };
  feedback: string;
}

interface TestReportProps {
  date: string;
  overallBand: number;
  type: string;
  results: QuestionResult[];
}

export function TestReport({ date, overallBand, type, results }: TestReportProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = [
    { label: 'Fluency', score: 7.5, color: 'text-primary' },
    { label: 'Lexical', score: 7.0, color: 'text-secondary' },
    { label: 'Grammar', score: 8.0, color: 'text-accent' },
    { label: 'Pronunciation', score: 7.5, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Hero Result Section */}
      <div className="glass-card p-10 border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 relative overflow-hidden text-center md:text-left">
         <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm">
            <Award className="w-64 h-64 text-primary" />
         </div>

         <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="flex flex-col items-center gap-4">
               <BandBadge score={overallBand} size="lg" className="scale-150 mb-4" />
               <div className="px-6 py-2 bg-primary/20 border border-primary/30 rounded-full text-primary font-black uppercase tracking-widest text-[10px]">
                  Estimated Overall Band
               </div>
            </div>

            <div className="flex-grow space-y-6">
               <div>
                  <h2 className="text-4xl font-black font-heading text-white">Kết quả bài thi</h2>
                  <p className="text-text-secondary mt-2 flex items-center gap-4 text-sm font-bold uppercase tracking-wider">
                     <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {date}</span>
                     <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
                     <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-success" /> {type}</span>
                  </p>
               </div>
               
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((s) => (
                     <div key={s.label} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1 group hover:border-white/10 transition-colors">
                        <div className="text-[10px] text-text-muted font-black uppercase tracking-widest leading-none">
                           {s.label}
                        </div>
                        <div className={cn("text-2xl font-black font-heading", s.color)}>
                           {s.score}
                        </div>
                     </div>
                  ))}
               </div>

               <div className="flex flex-wrap gap-4 pt-4">
                  <Button className="gap-2 px-8 shadow-lg shadow-primary/20">
                     <Share2 className="w-4 h-4" />
                     Chia sẻ kết quả
                  </Button>
                  <Button variant="glass" className="gap-2">
                     <Download className="w-4 h-4" />
                     Tải PDF Báo cáo
                  </Button>
               </div>
            </div>
         </div>
      </div>

      {/* Per-Question Details */}
      <section className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-accent rounded-full"></div>
            <h3 className="text-2xl font-bold font-heading text-white">Chi tiết từng câu hỏi</h3>
         </div>

         <div className="space-y-4">
            {results.map((r, index) => (
               <div 
                  key={r.id}
                  className={cn(
                     "glass-card border border-white/10 overflow-hidden transition-all duration-300",
                     expandedId === r.id ? "bg-white/[0.04] ring-1 ring-white/10" : "hover:bg-white/[0.02]"
                  )}
               >
                  <button 
                     onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                     className="w-full px-6 py-5 flex items-center gap-6"
                  >
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-text-secondary shrink-0">
                        {index + 1}
                     </div>
                     
                     <div className="flex-grow text-left">
                        <div className="flex items-center gap-2 text-[10px] text-text-muted font-black uppercase tracking-wider mb-1">
                           <Zap className="w-3 h-3 text-primary" />
                           Part {r.part}
                        </div>
                        <h4 className="text-white font-bold leading-tight group">
                           {r.question}
                        </h4>
                     </div>

                     <div className="flex items-center gap-8 pr-2">
                        <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-text-muted uppercase">
                           <div className="flex flex-col items-center">
                              <span>FC</span>
                              <span className="text-white">{r.scores.fc}</span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span>LR</span>
                              <span className="text-white">{r.scores.lr}</span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span>GRA</span>
                              <span className="text-white">{r.scores.gra}</span>
                           </div>
                        </div>
                        <BandBadge score={r.overall_band} size="sm" />
                        {expandedId === r.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                     </div>
                  </button>

                  <div className={cn(
                    "px-10 pb-8 transition-all duration-500 origin-top overflow-hidden",
                    expandedId === r.id ? "max-h-[1000px] opacity-100 py-6" : "max-h-0 opacity-0 py-0"
                  )}>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4">
                        <div className="lg:col-span-2 space-y-6">
                           <div className="space-y-3">
                              <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                 <MessageCircle className="w-3.5 h-3.5" />
                                 AI Feedback (Việt Nam)
                              </label>
                              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                 {r.feedback}
                              </div>
                           </div>

                           <div className="flex gap-4">
                              <Button variant="glass" size="sm" className="gap-2 text-xs">
                                 <Play className="w-3.5 h-3.5" />
                                 Nghe lại bài nói
                              </Button>
                              <Button variant="glass" size="sm" className="gap-2 text-xs">
                                 <FileText className="w-3.5 h-3.5" />
                                 Xem Transcript
                              </Button>
                           </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl border border-white/5 space-y-4">
                               <h5 className="text-xs font-black uppercase tracking-widest text-white">Key takeaways</h5>
                               <ul className="space-y-3">
                                  <li className="flex items-start gap-2 text-xs text-text-secondary">
                                     <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                                     Sử dụng collocation "To the best of my knowledge" rất tốt.
                                  </li>
                                  <li className="flex items-start gap-2 text-xs text-text-secondary">
                                     <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                                     Cần chú ý kỹ âm đuôi /s/ trong các từ số nhiều.
                                  </li>
                                  <li className="flex items-start gap-2 text-xs text-text-secondary">
                                     <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                                     Nỗ lực paraphrase từ "good" thành "exceptional".
                                  </li>
                               </ul>
                            </div>
                            
                            <Button className="w-full gap-2 border-primary/20 text-xs px-0 bg-white/5 hover:bg-white/10" variant="glass">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                So sánh với bài trước
                            </Button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Action Footer */}
      <footer className="pt-12 text-center pb-8 border-t border-white/5">
         <div className="flex flex-col items-center gap-4">
            <h4 className="text-xl font-bold text-white">Bạn muốn cải thiện thêm?</h4>
            <p className="text-text-secondary max-w-sm mx-auto text-sm">
               Dành ra 15 phút mỗi ngày luyện theo từng câu để nâng band hiệu quả nhất.
            </p>
            <div className="flex gap-4 mt-4">
               <Button variant="glass" className="px-8 shadow-xl">Về trang chủ</Button>
               <Button className="px-10 bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20">
                  Luyện tập ngay
               </Button>
            </div>
         </div>
      </footer>
    </div>
  );
}
