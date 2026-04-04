import React from 'react';
import { BookOpen, GraduationCap, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FeatureCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
      {/* Practice Mode Card */}
      <div 
        onClick={() => navigate('/practice')}
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-white/10 p-8 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:border-primary/30"
      >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-colors" />
        <div className="relative z-10 space-y-4">
          <div className="p-4 bg-primary rounded-2xl w-fit shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">Luyện tập theo câu</h3>
            <p className="text-text-secondary mt-2 leading-relaxed">
              Lựa chọn các chủ đề forecast mới nhất để thực hành phát âm và trả lời câu hỏi IELTS Part 1, 2, 3.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3].map(part => (
              <button 
                key={part}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/practice/${part}`);
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-1.5 rounded-full text-xs font-bold text-text-secondary transition-all hover:text-white"
              >
                Part {part}
              </button>
            ))}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/practice/custom`);
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-1.5 rounded-full text-xs font-bold text-text-secondary transition-all hover:text-white"
            >
              Tự thêm câu hỏi
            </button>
          </div>

          <div className="flex items-center gap-2 text-primary font-bold pt-2 group-hover:gap-4 transition-all">
            Thực hành ngay
            <ChevronRight className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Test Exam Card */}
      <div 
        onClick={() => navigate('/test')}
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-400/10 border border-white/10 p-8 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:border-indigo-400/30"
      >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-indigo-500/20 blur-3xl group-hover:bg-indigo-500/30 transition-colors" />
        <div className="relative z-10 space-y-4">
          <div className="p-4 bg-indigo-500 rounded-2xl w-fit shadow-lg shadow-indigo-500/20 -rotate-3 group-hover:rotate-0 transition-transform">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">Thi thử IELTS</h3>
            <p className="text-text-secondary mt-2 leading-relaxed">
              Mô phỏng kỳ thi thật với examiner AI. Nhận báo cáo chi tiết về Band score và chiến lược nâng band.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="p-2 bg-indigo-400/20 rounded-xl">
               <Zap className="w-5 h-5 text-indigo-400" />
             </div>
             <div>
               <div className="text-sm font-bold text-white">Full Mock Test</div>
               <div className="text-[10px] uppercase font-semibold text-text-secondary tracking-widest">15 - 20 Phút</div>
             </div>
          </div>

          <div className="flex items-center gap-2 text-indigo-400 font-bold group-hover:gap-4 transition-all">
            Bắt đầu thi thử
            <ChevronRight className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>
    </div>
  );
}
