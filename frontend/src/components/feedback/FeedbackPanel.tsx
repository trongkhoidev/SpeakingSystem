import { useState } from 'react';
import { OverallBandBadge } from './OverallBandBadge';
import { WordChips } from './WordChips';
import { AzureDashboard } from './AzureDashboard';
import { ReasoningCards } from './ReasoningCards';
import { ModelAnswer } from './ModelAnswer';
import { AudioPlayer } from '../audio/AudioPlayer';
import { Check, ArrowRight, Share2, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface AssessmentResult {
  id?: string;
  overall_band: number;
  student_transcript: string;
  audio_url?: string;
  azure_pronunciation: any;
  feedback_json: any;
  band_scores: {
    FC: number;
    LR: number;
    GRA: number;
    PRON: number;
  };
  color_coded_transcript: any[];
  is_relevant?: boolean;
  relevance_score?: number;
}

interface FeedbackPanelProps {
  result: AssessmentResult;
  onNext?: () => void;
}

export function FeedbackPanel({ result, onNext }: FeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'analysis'>('overview');

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Top Header Section with Band Badge */}
      <div className="flex flex-col md:flex-row items-center gap-10 p-10 rounded-[2rem] bg-white border border-[#E8ECF1] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 flex gap-3 text-[#9CA3AF]">
          <Share2 className="w-5 h-5 cursor-pointer hover:text-[#4361EE] transition-colors" />
          <Download className="w-5 h-5 cursor-pointer hover:text-[#4361EE] transition-colors" />
        </div>
        
        <div className="flex flex-col items-center gap-4">
           <div className="w-28 h-28 bg-[#EEF0FD] rounded-full flex items-center justify-center">
              <div className="text-5xl font-bold text-[#4361EE]">{result.overall_band}</div>
           </div>
           <div className="px-4 py-1.5 bg-[#EEF0FD] rounded-full text-[#4361EE] font-bold uppercase tracking-wider text-[10px]">
              Band Score
           </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex items-center justify-center md:justify-start gap-3 text-[#4361EE] font-bold tracking-widest text-[11px] uppercase">
            <span className="w-8 h-[2px] bg-[#4361EE]/20" />
            Đánh giá tổng quát
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1D2B] leading-tight font-heading">
            Kết quả của bạn đã sẵn sàng!
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium leading-relaxed max-w-2xl">
            AI đã phân tích giọng nói và ngôn ngữ của bạn dựa trên tiêu chuẩn IELTS. Hãy xem các phân tích chi tiết bên dưới để cải thiện điểm số.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex bg-[#F0F2F5] p-1.5 rounded-2xl border border-[#E8ECF1] w-fit">
            <button 
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-8 py-2.5 font-bold rounded-xl text-[11px] uppercase tracking-widest transition-all",
                activeTab === 'overview' ? "bg-white text-[#4361EE] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"
              )}
            >
              Tổng quan
            </button>
            <button 
              onClick={() => setActiveTab('transcript')}
              className={cn(
                "px-8 py-2.5 font-bold rounded-xl text-[11px] uppercase tracking-widest transition-all",
                activeTab === 'transcript' ? "bg-white text-[#4361EE] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"
              )}
            >
              Transcript
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={cn(
                "px-8 py-2.5 font-bold rounded-xl text-[11px] uppercase tracking-widest transition-all",
                activeTab === 'analysis' ? "bg-white text-[#4361EE] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"
              )}
            >
              Phân tích AI
            </button>
          </div>

          <div className="animate-in fade-in duration-500">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <AzureDashboard results={result.azure_pronunciation} bandScores={result.band_scores} />
                <ReasoningCards 
                  answerId={result.id}
                  transcript={result.student_transcript}
                  feedback={result.feedback_json} 
                />
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-6">
                <WordChips tokens={result.color_coded_transcript} />
                <div className="card p-6 bg-white border-[#E8ECF1]">
                  <AudioPlayer src={result.audio_url} />
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <ModelAnswer answer={result.feedback_json.model_answer} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Takeaways */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2rem] bg-[#EEF0FD]/50 border border-[#4361EE]/10 shadow-sm space-y-6">
            <h4 className="text-[#4361EE] font-bold tracking-widest text-[11px] uppercase">Mục tiêu cải thiện</h4>
            <ul className="space-y-4">
              {result.band_scores.PRON < 7.0 && (
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-0.5 rounded-full bg-[#4361EE]/10">
                    <Check className="w-3.5 h-3.5 text-[#4361EE]" />
                  </div>
                  <span className="text-[#1A1D2B] font-medium text-[13.5px] leading-relaxed">
                    Phát âm (Pronunciation): {result.band_scores.PRON}/9
                  </span>
                </li>
              )}
              {result.band_scores.FC < 7.0 && (
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-0.5 rounded-full bg-[#4361EE]/10">
                    <Check className="w-3.5 h-3.5 text-[#4361EE]" />
                  </div>
                  <span className="text-[#1A1D2B] font-medium text-[13.5px] leading-relaxed">
                    Trôi chảy (Fluency): {result.band_scores.FC}/9
                  </span>
                </li>
              )}
              {result.band_scores.LR < 7.0 && (
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-0.5 rounded-full bg-[#4361EE]/10">
                    <Check className="w-3.5 h-3.5 text-[#4361EE]" />
                  </div>
                  <span className="text-[#1A1D2B] font-medium text-[13.5px] leading-relaxed">
                    Từ vựng (Lexical): {result.band_scores.LR}/9
                  </span>
                </li>
              )}
            </ul>
            <button className="btn btn-primary w-full py-4 rounded-xl text-[13px] shadow-indigo-100">
              Luyện tập lại ngay
            </button>
          </div>

          <button 
            onClick={onNext}
            className="w-full p-8 rounded-[2rem] bg-white border border-[#E8ECF1] hover:border-[#4361EE] hover:shadow-lg transition-all text-left flex items-center justify-between group"
          >
            <div>
              <p className="text-[#9CA3AF] font-bold tracking-widest text-[10px] uppercase mb-1">Bước tiếp theo</p>
              <h5 className="text-[17px] font-bold text-[#1A1D2B] group-hover:text-[#4361EE] transition-colors">Câu hỏi tiếp theo</h5>
            </div>
            <ArrowRight className="w-6 h-6 text-[#4361EE] group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
