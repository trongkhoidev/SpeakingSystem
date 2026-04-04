import { useState } from 'react';
import { OverallBandBadge } from './OverallBandBadge';
import { WordChips } from './WordChips';
import { AzureDashboard } from './AzureDashboard';
import { ReasoningCards } from './ReasoningCards';
import { ModelAnswer } from './ModelAnswer';
import { AudioPlayer } from '../audio/AudioPlayer';
import { Check, ArrowRight, Share2, Download } from 'lucide-react';
import { Button } from '../shared/Button';

interface AssessmentResult {
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
}

interface FeedbackPanelProps {
  result: AssessmentResult;
  onNext?: () => void;
}

export function FeedbackPanel({ result, onNext }: FeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'analysis'>('overview');

  return (
    <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Top Header Section with Band Badge */}
      <div className="flex flex-col md:flex-row items-center gap-12 p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 flex gap-3 text-white/20">
          <Share2 className="w-5 h-5 cursor-pointer hover:text-white/60 transition-colors" />
          <Download className="w-5 h-5 cursor-pointer hover:text-white/60 transition-colors" />
        </div>
        
        <OverallBandBadge band={result.overall_band} />
        
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex items-center justify-center md:justify-start gap-3 text-indigo-400 font-black tracking-widest text-xs uppercase">
            <span className="w-8 h-[1px] bg-indigo-500/40" />
            Đánh giá tổng quát
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight font-heading">
            Kết quả của bạn đã sẵn sàng!
          </h2>
          <p className="text-text-secondary text-lg font-medium opacity-60">
            Bạn đã hoàn thành phần luyện tập. AI của chúng tôi đã phân tích giọng nói và ngôn ngữ của bạn dựa trên tiêu chuẩn IELTS.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics & Analysis */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-8 py-3 font-extrabold rounded-xl text-[11px] uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'}`}
            >
              Tổng quan
            </button>
            <button 
              onClick={() => setActiveTab('transcript')}
              className={`px-8 py-3 font-extrabold rounded-xl text-[11px] uppercase tracking-widest transition-all ${activeTab === 'transcript' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'}`}
            >
              Bản dịch chi tiết
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`px-8 py-3 font-extrabold rounded-xl text-[11px] uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'}`}
            >
              Phân tích AI
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <AzureDashboard results={result.azure_pronunciation} bandScores={result.band_scores} />
              <ReasoningCards feedback={result.feedback_json} />
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-8">
              <WordChips tokens={result.color_coded_transcript} />
              <AudioPlayer src={result.audio_url} />
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-8">
              <ModelAnswer answer={result.feedback_json.model_answer} />
            </div>
          )}
        </div>

        {/* Right Column: Key Takeaways / Next Steps */}
        <div className="space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 glass-card">
            <h4 className="text-indigo-400 font-extrabold tracking-widest text-[11px] uppercase mb-6">Mục tiêu tiếp theo</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 p-0.5 rounded-full bg-indigo-500/20">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-white/80 font-bold text-sm leading-relaxed">Cải thiện Pronunciation với các từ bị lỗi</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 p-0.5 rounded-full bg-indigo-500/20">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-white/80 font-bold text-sm leading-relaxed">Sử dụng thêm từ nối trong tiêu chí Fluency</span>
              </li>
            </ul>
            <Button className="w-full mt-10 rounded-2xl py-8 bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
              Luyện lại câu này
            </Button>
          </div>

          <button 
            onClick={onNext}
            className="w-full p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all text-left flex items-center justify-between group"
          >
            <div>
              <p className="text-white/40 font-black tracking-widest text-[10px] uppercase mb-1">Tiếp tục</p>
              <h5 className="text-xl font-black text-white">Câu hỏi tiếp theo</h5>
            </div>
            <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
