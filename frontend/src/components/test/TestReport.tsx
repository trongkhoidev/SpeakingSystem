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
import { Button } from '../ui/Button';
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
    { label: 'Fluency', score: 7.5, color: 'text-[#4361EE]' },
    { label: 'Lexical', score: 7.0, color: 'text-[#7C3AED]' },
    { label: 'Grammar', score: 8.0, color: 'text-[#F59E0B]' },
    { label: 'Pronunciation', score: 7.5, color: 'text-[#1A8F5C]' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Hero Result Section */}
      <div className="card p-10 bg-white border-none shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Award className="w-64 h-64 text-[#4361EE]" />
         </div>

         <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-32 h-32 bg-[#EEF0FD] rounded-full flex items-center justify-center">
               <div className="text-5xl font-bold text-[#4361EE]">{overallBand}</div>
            </div>
            <div className="px-4 py-1.5 bg-[#EEF0FD] rounded-full text-[#4361EE] font-bold uppercase tracking-wider text-[10px]">
               Overall Band Estimate
            </div>
         </div>

         <div className="flex-grow space-y-6 relative z-10 text-center md:text-left">
            <div>
               <h2 className="text-[28px] font-bold text-[#1A1D2B] font-heading">Báo cáo kết quả bài thi</h2>
               <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-2 text-[12.5px] text-[#6B7280]">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#9CA3AF]" /> {date}</span>
                  <span className="w-1 h-1 bg-[#E8ECF1] rounded-full"></span>
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-[#1A8F5C]" /> {type}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {stats.map((s) => (
                  <div key={s.label} className="p-4 bg-[#F8F9FB] rounded-2xl border border-[#E8ECF1] space-y-1">
                     <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest leading-none">
                        {s.label}
                     </div>
                     <div className={cn("text-2xl font-bold font-heading", s.color)}>
                        {s.score}
                     </div>
                  </div>
               ))}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
               <button className="btn btn-primary px-8 shadow-indigo-200">
                  <Share2 className="w-4 h-4" /> Chia sẻ
               </button>
               <button className="btn btn-ghost px-8">
                  <Download className="w-4 h-4" /> Tải PDF
               </button>
            </div>
         </div>
      </div>

      {/* Per-Question Details */}
      <section className="space-y-4">
         <p className="section-title mb-2">Phân tích chi tiết từng câu hỏi</p>

         <div className="space-y-3">
            {results.map((r, index) => (
               <div 
                  key={r.id}
                  className={cn(
                     "card p-0 overflow-hidden transition-all duration-300",
                     expandedId === r.id ? "ring-2 ring-[#4361EE]/10" : "hover:border-[#4361EE]/30"
                  )}
               >
                  <button 
                     onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                     className="w-full px-6 py-5 flex items-center gap-6"
                  >
                     <div className="w-9 h-9 rounded-lg bg-[#F0F2F5] flex items-center justify-center font-bold text-[#6B7280] text-sm shrink-0">
                        {index + 1}
                     </div>
                     
                     <div className="flex-grow text-left">
                        <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1">
                           Part {r.part}
                        </div>
                        <h4 className="text-[15px] font-bold text-[#1A1D2B] leading-tight group">
                           {r.question}
                        </h4>
                     </div>

                     <div className="flex items-center gap-8 pr-2">
                        <div className="hidden sm:flex items-center gap-5 text-[11px] font-bold text-[#9CA3AF] uppercase">
                           <div className="flex flex-col items-center">
                              <span>FC</span>
                              <span className="text-[#1A1D2B]">{r.scores.fc}</span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span>LR</span>
                              <span className="text-[#1A1D2B]">{r.scores.lr}</span>
                           </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#EEF0FD] flex items-center justify-center text-[#4361EE] font-bold">
                           {r.overall_band}
                        </div>
                        {expandedId === r.id ? <ChevronUp className="w-5 h-5 text-[#9CA3AF]" /> : <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />}
                     </div>
                  </button>

                  <div className={cn(
                    "px-8 pb-8 transition-all duration-500 origin-top overflow-hidden",
                    expandedId === r.id ? "max-h-[1000px] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
                  )}>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-[#F0F2F5]">
                        <div className="lg:col-span-2 space-y-6">
                           <div className="space-y-3">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-[#4361EE] flex items-center gap-2">
                                 <MessageCircle className="w-4 h-4" /> Phản hồi từ AI
                              </label>
                              <div className="p-6 bg-[#F8F9FB] rounded-2xl border border-[#E8ECF1] text-[#1A1D2B] text-[14px] leading-relaxed whitespace-pre-wrap">
                                 {r.feedback}
                              </div>
                           </div>

                           <div className="flex gap-3">
                              <button className="btn btn-ghost px-6 py-2.5 text-xs">
                                 <Play className="w-3.5 h-3.5" /> Nghe lại
                              </button>
                              <button className="btn btn-ghost px-6 py-2.5 text-xs">
                                 <FileText className="w-3.5 h-3.5" /> Xem Transcript
                              </button>
                           </div>
                        </div>

                        <div className="space-y-5">
                            <div className="p-6 bg-[#EEF0FD]/50 rounded-2xl border border-[#4361EE]/10 space-y-4">
                               <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#1A1D2B]">Điểm nổi bật</h5>
                               <ul className="space-y-3">
                                  <li className="flex items-start gap-2.5 text-[12.5px] text-[#6B7280]">
                                     <div className="w-1.5 h-1.5 rounded-full bg-[#4361EE] mt-1.5 flex-shrink-0" />
                                     Sử dụng collocation phù hợp với chủ đề.
                                  </li>
                                  <li className="flex items-start gap-2.5 text-[12.5px] text-[#6B7280]">
                                     <div className="w-1.5 h-1.5 rounded-full bg-[#4361EE] mt-1.5 flex-shrink-0" />
                                     Cần cải thiện ngữ điệu ở các câu phức.
                                  </li>
                               </ul>
                            </div>
                            
                            <button className="btn btn-ghost w-full text-xs py-3">
                                <TrendingUp className="w-4 h-4 text-[#4361EE]" /> So sánh kết quả
                            </button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Action Footer */}
      <footer className="pt-10 text-center pb-12 border-t border-[#E8ECF1]">
         <div className="flex flex-col items-center gap-4">
            <h4 className="text-xl font-bold text-[#1A1D2B] font-heading">Bạn đã sẵn sàng cho bước tiếp theo?</h4>
            <p className="text-[13.5px] text-[#6B7280] max-w-sm mx-auto">
               Luyện tập hàng ngày là chìa khóa để đạt band score mong muốn.
            </p>
            <div className="flex gap-3 mt-4">
               <button className="btn btn-ghost px-8">Về trang chủ</button>
               <button className="btn btn-primary px-10 shadow-indigo-200">Luyện tập ngay</button>
            </div>
         </div>
      </footer>
    </div>
  );
}
