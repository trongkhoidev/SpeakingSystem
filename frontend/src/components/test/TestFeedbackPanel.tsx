import React from 'react';
import { 
  AlertCircle, 
  History, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Volume2
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestFeedbackPanelProps {
  feedback: any;
  questionText: string;
  audioUrl?: string | null;
  className?: string;
  footer?: React.ReactNode;
}

export const TestFeedbackPanel: React.FC<TestFeedbackPanelProps> = ({
  feedback,
  questionText,
  audioUrl,
  className,
  footer
}) => {
  if (!feedback) return null;

  const isRelevant = feedback.is_relevant !== false;

  return (
    <div className={cn("w-full flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500 text-left", className)}>
      {!isRelevant && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-amber-900">Nội dung lạc đề! (Relevance: {feedback.relevance_score}%)</h3>
            <p className="text-[15px] text-amber-800 font-medium max-w-lg mx-auto leading-relaxed">
              Câu trả lời của bạn dường như không liên quan đến chủ đề của câu hỏi. Hệ thống đã tạm dừng đánh giá chuyên sâu để tiết kiệm tài nguyên.
            </p>
          </div>
        </div>
      )}

      {/* TOP PART: Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: Transcript & Pronunciation */}
        <div className="space-y-6">
          <div className={cn(
            "bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden",
            !isRelevant && "opacity-50 pointer-events-none grayscale"
          )}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Bản ghi bài nói & Phát âm
              </h3>
              {audioUrl && (
                <button 
                  onClick={() => new Audio(audioUrl).play()}
                  className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>

            <div className="p-6 bg-slate-50/50 rounded-3xl flex flex-wrap gap-x-2 gap-y-2 mb-8">
              {feedback.color_coded_transcript ? (
                feedback.color_coded_transcript.map((word: any, i: number) => (
                  <div key={i} className="flex flex-col items-center min-w-[40px] py-1">
                    <span
                      className={cn(
                        "text-[18px] font-bold transition-all",
                        word.color === 'green' ? "text-emerald-600" :
                          word.color === 'red' ? "text-rose-600 underline decoration-2" :
                            "text-amber-600"
                      )}
                    >
                      {word.word}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 font-mono mt-1 tracking-tighter">
                      {word.phonemes?.map((p: any) => p.phoneme).join('') || '...'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[16px] text-slate-700 font-medium leading-relaxed italic opacity-50">
                  {feedback.student_transcript || 'Không có bản ghi nhận diện nào.'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl">
              {[
                { label: 'Accuracy', val: feedback.azure_pronunciation?.accuracy_score, color: 'emerald' },
                { label: 'Fluency', val: feedback.azure_pronunciation?.fluency_score, color: 'blue' },
                { label: 'Prosody', val: feedback.azure_pronunciation?.prosody_score, color: 'purple' }
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{m.label}</p>
                  <p className={cn("text-[20px] font-black", 
                    m.color === 'emerald' ? "text-emerald-600" : 
                    m.color === 'blue' ? "text-blue-600" : "text-purple-600"
                  )}>{Math.round(m.val ?? 0)}%</p>
                  <div className="w-full h-1.5 bg-white rounded-full mt-2 overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", 
                        m.color === 'emerald' ? "bg-emerald-500" : 
                        m.color === 'blue' ? "bg-blue-500" : "bg-purple-500"
                      )} 
                      style={{ width: `${m.val || 0}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Section: Content & Semantic Errors */}
          {(feedback.content_errors || feedback.thought_process) && (
            <div className="space-y-6">
              {feedback.content_errors && (
                <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 space-y-4">
                  <h3 className="text-[10px] font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Lỗi nội dung & Ngữ nghĩa
                  </h3>
                  <p className="text-[14px] text-rose-800 font-medium leading-relaxed">
                    {feedback.content_errors}
                  </p>
                </div>
              )}

              {feedback.thought_process && (
                <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 space-y-4">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Phân tích từ Giám khảo (Overall Reasoning)
                  </h3>
                  <div className="text-[14px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {feedback.thought_process}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Analysis */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Đánh giá chi tiết (FC, LR, GRA)
            </h3>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Score</span>
              <span className="text-[18px] font-black text-blue-600 leading-none">{feedback.overall_band?.toFixed(1) || '0.0'}</span>
            </div>
          </div>

          <div className="space-y-4">
            {['FC', 'LR', 'GRA'].map((cat) => {
              const catFeedback = feedback.feedback_json?.[cat];
              const score = feedback.band_scores?.[cat] || 0;
              return (
                <div key={cat} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] text-white font-black shadow-lg",
                        cat === 'FC' ? "bg-blue-600 shadow-blue-100" : 
                        cat === 'LR' ? "bg-purple-600 shadow-purple-100" : 
                        "bg-orange-600 shadow-orange-100"
                      )}>{cat}</div>
                      <span className="text-[13px] font-black uppercase tracking-widest text-slate-900">
                        {cat === 'FC' ? 'Fluency & Coherence' : 
                         cat === 'LR' ? 'Lexical Resource' : 
                         'Grammatical Accuracy'}
                      </span>
                    </div>
                    <span className="text-[16px] font-black text-slate-900">{score.toFixed(1)}</span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                      {catFeedback?.reasoning || catFeedback?.feedback || 'Đang cập nhật phân tích...'}
                    </p>

                    {(catFeedback?.solution) && (
                      <div className="flex items-start gap-2 text-[13px] text-emerald-700 font-bold bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{catFeedback.solution}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM PART: Upgrader */}
      {feedback.upgrader && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-10 rounded-[3rem] shadow-xl shadow-blue-500/5 space-y-8 animate-in slide-in-from-bottom duration-700 border border-blue-100/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[13px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                Gợi ý trả lời Band {feedback.upgrader.target_band || '8.0'}+
              </h3>
              <p className="text-[11px] text-blue-600/60 font-black uppercase tracking-widest ml-14">Nâng cấp từ bài nói của bạn (+1.0 Band)</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative bg-white p-10 rounded-[2rem] shadow-sm leading-relaxed border border-blue-50">
              <p className="text-[20px] md:text-[24px] text-slate-800 font-bold font-serif italic text-center">
                "{feedback.upgrader.improved_sample_answer}"
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {feedback.upgrader.topic_vocabulary?.length > 0 && (
              <div className="space-y-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  Từ vựng chủ đề (Topic Vocabulary):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {feedback.upgrader.topic_vocabulary.map((v: any, i: number) => (
                    <div key={i} className="bg-white/80 p-5 rounded-2xl hover:bg-white transition-all border border-slate-100 group hover:shadow-md">
                      <p className="text-[15px] font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{v.phrase}</p>
                      <p className="text-[13px] text-slate-600 font-bold">{v.meaning}</p>
                      <p className="text-[11px] text-slate-400 mt-2 italic leading-relaxed">{v.usage}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {footer && (
        <div className="pt-8 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};
