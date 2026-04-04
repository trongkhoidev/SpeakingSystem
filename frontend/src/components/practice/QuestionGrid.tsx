import { Mic, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  part: number;
  is_custom: boolean;
  answered?: boolean;
  score?: number;
}

interface QuestionGridProps {
  questions: Question[];
  onSelectQuestion: (question: Question) => void;
  isLoading: boolean;
}

export function QuestionGrid({ questions, onSelectQuestion, isLoading }: QuestionGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 content-start overflow-y-auto max-h-[calc(100vh-200px)] p-1 pr-3 custom-scrollbar">
      {questions.map((question) => (
        <button
          key={question.id}
          onClick={() => onSelectQuestion(question)}
          className="group relative flex flex-col items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 hover-lift transition-all hover:border-primary/40 hover:bg-white/[0.08] text-left"
        >
          {/* Status Indicator */}
          {question.answered && (
            <div className="absolute top-4 right-4 text-green-400">
               <div className="flex flex-col items-end gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{question.score ? `Band ${question.score}` : 'Hoàn thành'}</span>
               </div>
            </div>
          )}

          <h4 className="font-bold text-white pr-10 leading-tight group-hover:text-primary transition-colors">
            {question.text}
          </h4>
          
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 text-text-secondary rounded-lg">
              Part {question.part}
            </span>
            {question.is_custom && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-500/30 text-indigo-300 rounded-lg">
                Câu bạn thêm
              </span>
            )}
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/20 text-primary text-xs font-bold transition-all group-hover:bg-primary group-hover:text-white shadow-inner-white">
              <Mic className="w-3.5 h-3.5" />
              <span>Luyện ngay</span>
            </div>
          </div>
        </button>
      ))}
      
      {questions.length === 0 && (
        <div className="col-span-full py-16 flex flex-col items-center gap-4 glass-card border-dashed">
          <div className="p-4 bg-white/5 rounded-2xl">
            <Mic className="w-8 h-8 text-text-secondary opacity-30" />
          </div>
          <p className="text-text-secondary font-medium italic opacity-50">Hãy chọn một chủ đề để bắt đầu luyện tập</p>
        </div>
      )}
    </div>
  );
}
