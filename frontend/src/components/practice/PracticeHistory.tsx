import { useEffect, useState } from 'react';
import { History, Clock, ChevronRight, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface HistoryItem {
  id: string;
  question_text: string;
  overall_band: number;
  created_at: string;
  part: number;
}

export function PracticeHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/user/history');
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">Chưa có lịch sử luyện tập</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {history.map((item) => (
        <div 
          key={item.id}
          className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-3xl p-6 transition-all duration-500 hover-lift overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award className="w-16 h-16" />
          </div>
          
          <div className="flex items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                  Part {item.part}
                </span>
                <div className="flex items-center gap-1.5 text-text-tertiary text-[10px] font-bold">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <h4 className="text-white font-bold line-clamp-1 group-hover:text-primary transition-colors">
                {item.question_text}
              </h4>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={cn(
                  "text-2xl font-black font-heading",
                  item.overall_band >= 7 ? "text-green-400" : 
                  item.overall_band >= 5 ? "text-yellow-400" : "text-red-400"
                )}>
                  {item.overall_band.toFixed(1)}
                </div>
                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Band</div>
              </div>
              
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
