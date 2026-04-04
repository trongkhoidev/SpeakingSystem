import React, { useState } from 'react';
import { TrendingUp, ChevronDown, Lightbulb } from 'lucide-react';

interface BandEstimateProps {
  currentBand: number;
  change?: number;
  tips: { title: string; content: string }[];
  isLoading?: boolean;
}

export function BandEstimate({ currentBand, change = 0, tips, isLoading = false }: BandEstimateProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between space-y-6 hover-lift h-full border-t-2 border-primary/20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Ước lượng Band
        </h3>
        <span className="text-[10px] font-bold text-text-secondary bg-white/5 py-1 px-3 rounded-full border border-white/5 uppercase tracking-wider">
          Dựa trên 10 bài gần nhất
        </span>
      </div>

      <div className="flex items-end gap-4">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-50" />
          <div className="relative text-6xl font-bold text-white tracking-tighter drop-shadow-sm font-heading animate-in zoom-in duration-1000">
            {currentBand.toFixed(1)}
          </div>
        </div>
        <div className="flex flex-col mb-2">
          <div className={`text-sm font-bold flex items-center gap-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}
            <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
          </div>
          <span className="text-[10px] text-text-secondary font-semibold uppercase opacity-60">Tháng này</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest pl-1">
          <Lightbulb className="w-3.5 h-3.5" />
          Lưu ý cải thiện
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
          {tips.map((tip, index) => (
            <div 
              key={index} 
              className="group overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]"
            >
              <button 
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between p-3 text-left transition-all"
              >
                <span className="text-sm font-medium text-white/90 group-hover:text-white">{tip.title}</span>
                <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-3 pt-0 text-xs text-text-secondary leading-relaxed border-t border-white/5 mx-3 mt-1">
                  {tip.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
