import { 
  Award, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Share2,
  TrendingUp,
  Play,
  History,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { TestFeedbackPanel } from './TestFeedbackPanel';

interface QuestionResult {
  id: string;
  question: string;
  part: number;
  overall_band: number;
  fc_band: number;
  lr_band: number;
  gra_band: number;
  pron_band: number;
  student_transcript: string;
  audio_url: string | null;
  word_details: any;
  azure_pronunciation: any;
  feedback_json: any;
  thought_process?: string;
  content_errors?: string;
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
    { label: 'Fluency', score: results?.length ? (results.reduce((acc, r) => acc + (r.fc_band || 0), 0) / results.length).toFixed(1) : '0.0', color: 'text-[#4361EE]' },
    { label: 'Lexical', score: results?.length ? (results.reduce((acc, r) => acc + (r.lr_band || 0), 0) / results.length).toFixed(1) : '0.0', color: 'text-[#7C3AED]' },
    { label: 'Grammar', score: results?.length ? (results.reduce((acc, r) => acc + (r.gra_band || 0), 0) / results.length).toFixed(1) : '0.0', color: 'text-[#F59E0B]' },
    { label: 'Pronunciation', score: results?.length ? (results.reduce((acc, r) => acc + (r.pron_band || 0), 0) / results.length).toFixed(1) : '0.0', color: 'text-[#1A8F5C]' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Hero Result Section */}
      <div className="card p-10 bg-white border-none shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Award className="w-64 h-64 text-[#4361EE]" />
         </div>

         <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-32 h-32 bg-[#EEF0FD] rounded-full flex items-center justify-center border-4 border-white shadow-inner">
               <div className="text-5xl font-bold text-[#4361EE]">{(overallBand || 0).toFixed(1)}</div>
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
         <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-6">Phân tích chi tiết từng câu hỏi</p>

         <div className="space-y-4">
            {results?.map((r, index) => (
               <div 
                  key={r.id}
                  className={cn(
                     "card p-0 overflow-hidden transition-all duration-300 bg-white border border-slate-100",
                     expandedId === r.id ? "ring-2 ring-blue-600/10 shadow-lg" : "hover:border-blue-600/30"
                  )}
               >
                  <button 
                     onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                     className="w-full px-8 py-6 flex items-center gap-6"
                  >
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-sm shrink-0 border border-slate-100">
                        {index + 1}
                     </div>
                     
                     <div className="flex-grow text-left">
                        <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">
                           Part {r.part}
                        </div>
                        <h4 className="text-[16px] font-bold text-slate-900 leading-tight">
                           {r.question}
                        </h4>
                     </div>

                     <div className="flex items-center gap-10 pr-2">
                        <div className="hidden md:flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                           <div className="flex flex-col items-center gap-1">
                              <span>FC</span>
                              <span className="text-slate-900">{r.fc_band?.toFixed(1) || '0.0'}</span>
                           </div>
                           <div className="flex flex-col items-center gap-1">
                              <span>LR</span>
                              <span className="text-slate-900">{r.lr_band?.toFixed(1) || '0.0'}</span>
                           </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg border border-blue-100">
                           {r.overall_band?.toFixed(1) || '0.0'}
                        </div>
                        <div className={cn("w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-transform", expandedId === r.id && "rotate-180")}>
                           <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                     </div>
                  </button>

                  <div className={cn(
                    "px-8 transition-all duration-500 origin-top overflow-hidden",
                    expandedId === r.id ? "max-h-[2000px] opacity-100 pb-10" : "max-h-0 opacity-0"
                  )}>
                     <div className="pt-8 border-t border-slate-100">
                        <TestFeedbackPanel 
                          feedback={{
                            ...r,
                            color_coded_transcript: r.word_details
                          }} 
                          questionText={r.question}
                          audioUrl={r.audio_url}
                        />
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
