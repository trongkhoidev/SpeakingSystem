import { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, Calendar, Award,
  Zap, FileText, TrendingUp, History, ArrowRight,
  Clock, Target, Sparkles, Info
} from 'lucide-react';
import { TestSetupModal, TestConfig } from '../components/test/TestSetupModal';
import { TestRunner } from '../components/test/TestRunner';
import { TestReport } from '../components/test/TestReport';
import { BandBadge } from '../components/shared/BandBadge';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface TestHistoryItem {
  id: string;
  created_at: string;
  mode: string;
  overall_band: number;
}

/* ── Exam mode card data ── */
const EXAM_MODES = [
  {
    id: 'full' as const,
    title: 'Full Test',
    description: 'Luyện tập trọn bộ 3 phần như thi thật (11–14 phút).',
    icon: Award,
    iconColor: '#B45309',
    iconBg: '#FFF7E6',
    accentColor: '#F59E0B',
  },
  {
    id: 'part1' as const,
    title: 'Part 1',
    description: 'Phỏng vấn ngắn về các chủ đề quen thuộc (4–5 phút).',
    icon: Zap,
    iconColor: '#4361EE',
    iconBg: '#EEF0FD',
    accentColor: '#4361EE',
  },
  {
    id: 'part2' as const,
    title: 'Part 2',
    description: 'Nói về một chủ đề trong Cue Card (3–4 phút).',
    icon: FileText,
    iconColor: '#7C3AED',
    iconBg: '#F3F0FF',
    accentColor: '#7C3AED',
  },
  {
    id: 'part3' as const,
    title: 'Part 3',
    description: 'Thảo luận chuyên sâu về các vấn đề xã hội (4–5 phút).',
    icon: TrendingUp,
    iconColor: '#1A8F5C',
    iconBg: '#E6F9F0',
    accentColor: '#22A06B',
  },
];

interface ExamSet {
  id: string;
  name: string;
  description: string;
  estimated_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

type ExamModeId = 'full' | 'part1' | 'part2' | 'part3';

export function TestExamPage() {
  const [history, setHistory]               = useState<TestHistoryItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [isSetupOpen, setIsSetupOpen]       = useState(false);
  const [selectedMode, setSelectedMode]     = useState<ExamModeId>('full');
  const [activeSession, setActiveSession]   = useState<any | null>(null);
  const [questions, setQuestions]           = useState<any[]>([]);
  const [testConfig, setTestConfig]         = useState<TestConfig | null>(null);
  const [showReport, setShowReport]         = useState<any | null>(null);

  const [examSets, setExamSets]             = useState<ExamSet[]>([]);
  const [loadingExamSets, setLoadingExamSets] = useState(false);
  const [selectedExamSetId, setSelectedExamSetId] = useState<string | null>(null);
  const [testMode, setTestMode]             = useState<'sets' | 'random'>('sets');
  const [currentTime, setCurrentTime]       = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/test/history');
      setHistory(res.data);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamSets = useCallback(async () => {
    setLoadingExamSets(true);
    try {
      const res = await api.get('/test/exam-sets');
      setExamSets(res.data);
      if (res.data.length > 0) setSelectedExamSetId(res.data[0].id);
    } catch (e) {
      console.error('Failed to fetch exam sets:', e);
    } finally {
      setLoadingExamSets(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchExamSets();
  }, [fetchExamSets]);

  const startTest = async (config: TestConfig) => {
    try {
      const res = await api.post('/test/start', { ...config, mode: selectedMode });
      setActiveSession(res.data.session);
      setQuestions(res.data.questions);
      setTestConfig(config);
      setIsSetupOpen(false);
    } catch (e) {
      console.error('Failed to start test:', e);
    }
  };

  const handleTestFinish = async () => {
    if (!activeSession) return;
    try {
      const res = await api.get(`/test/${activeSession.id}/report`);
      setShowReport(res.data);
      setActiveSession(null);
      fetchHistory();
    } catch (e) {
      console.error('Failed to fetch report:', e);
    }
  };

  const openSetup = (mode: ExamModeId = 'full') => {
    setSelectedMode(mode);
    setIsSetupOpen(true);
  };

  const handleViewReport = async (sessionId: string) => {
    try {
      const res = await api.get(`/test/${sessionId}/report`);
      setShowReport(res.data);
    } catch (e) {
      console.error('Failed to fetch report:', e);
    }
  };

  /* ── Test running state ── */
  if (activeSession && questions.length > 0 && testConfig) {
    return (
      <div style={{ padding: '20px 0' }}>
        <TestRunner
          sessionId={activeSession.id}
          config={testConfig}
          questions={questions}
          onComplete={handleTestFinish}
        />
      </div>
    );
  }

  /* ── Report state ── */
  if (showReport) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowReport(null)}
          >
            ← Quay lại danh sách
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Báo cáo chi tiết bài thi
          </span>
        </div>
        <TestReport
          date={showReport.date}
          overallBand={showReport.overallBand}
          type={showReport.type}
          results={showReport.results}
        />
      </div>
    );
  }

  /* ── Main view ── */
  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-10 space-y-10 animate-in fade-in duration-500 bg-slate-50 min-h-screen">
      
      {/* ── HEADER (Đồng bộ Premium) ── */}
      <header className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-80" />
        
        {/* Tiêu đề trang */}
        <div className="flex items-center gap-5 w-full">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-60">Chế độ thi</p>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">IELTS Mock Test</h1>
          </div>
        </div>

        {/* Thời gian hiện tại */}
        <div className="flex flex-col items-center justify-center border-x border-slate-100 px-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian hiện tại</p>
          <div className="flex items-center gap-2 text-slate-900">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-[18px] font-black tabular-nums">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </div>
        </div>
        
        {/* Trạng thái nhanh */}
        <div className="flex justify-end items-center gap-4">
           <div className="text-right hidden xl:block">
              <p className="text-[11px] font-bold text-slate-500">Chuẩn bị sẵn sàng?</p>
              <p className="text-[10px] text-slate-400 font-medium">Đảm bảo micro hoạt động tốt.</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Target className="w-5 h-5" />
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 items-start">
        
        {/* Cột trái: Cấu hình (8 cột) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-50">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[18px] font-black text-slate-900 tracking-tight">Cấu hình bài thi</h2>
                  <p className="text-[12px] font-bold text-slate-400">Chọn bộ đề thi thật hoặc luyện tập tự do</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-2xl w-fit shrink-0">
                <button 
                  onClick={() => setTestMode('sets')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all",
                    testMode === 'sets' ? "bg-white text-blue-600 shadow-md" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Bộ đề
                </button>
                <button 
                  onClick={() => setTestMode('random')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all",
                    testMode === 'random' ? "bg-white text-blue-600 shadow-md" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Tự do
                </button>
              </div>
            </div>

            {testMode === 'sets' ? (
              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {loadingExamSets ? (
                  [1,2,3].map(i => <div key={i} className="h-28 bg-slate-50 animate-pulse rounded-2xl" />)
                ) : (
                  examSets.map(set => (
                    <button 
                      key={set.id}
                      onClick={() => setSelectedExamSetId(set.id)}
                      className={cn(
                        "group relative p-6 bg-slate-50 border-2 rounded-2xl flex items-center justify-between transition-all text-left overflow-hidden",
                        selectedExamSetId === set.id 
                          ? "bg-white border-blue-600 shadow-xl shadow-blue-50 ring-4 ring-blue-600/5" 
                          : "border-transparent hover:border-blue-600/30 hover:bg-white"
                      )}
                    >
                      <div className="flex items-center gap-5 relative">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner",
                          set.difficulty === 'easy' ? "bg-emerald-50 text-emerald-600" :
                          set.difficulty === 'hard' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                        )}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[16px] font-black text-slate-900 tracking-tight">{set.name}</span>
                            <span className="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Official</span>
                          </div>
                          <p className="text-[12px] text-slate-500 font-medium line-clamp-1">{set.description}</p>
                          <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5 text-blue-600" /> {set.estimated_minutes} phút
                            </div>
                            <div className={cn(
                              "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg",
                              set.difficulty === 'easy' ? "bg-emerald-50 text-emerald-600" :
                              set.difficulty === 'hard' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {set.difficulty}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedExamSetId === set.id ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200" : "border-slate-200 text-slate-200 group-hover:border-blue-600 group-hover:text-blue-600"
                      )}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {EXAM_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => openSetup(mode.id)}
                      className="group p-6 bg-slate-50 border-2 border-transparent rounded-2xl text-left hover:border-blue-600 hover:bg-white transition-all flex gap-4"
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", mode.iconBg)}>
                         <mode.icon size={20} color={mode.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{mode.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{mode.description}</p>
                      </div>
                    </button>
                 ))}
              </div>
            )}

            <button 
              disabled={testMode === 'sets' && !selectedExamSetId}
              onClick={() => {
                 if (testMode === 'random') {
                   openSetup('full');
                 } else {
                   const selectedSet = examSets.find(s => s.id === selectedExamSetId);
                   if (selectedSet) {
                      startTest({
                        mode: 'full',
                        examinerVoice: localStorage.getItem('voice_pref') || 'female-uk',
                        questionCount: 5,
                        followUpEnabled: true,
                        exam_set_id: selectedSet.id
                      } as any);
                   }
                 }
              }}
              className="w-full mt-10 py-5 bg-blue-900 text-white rounded-2xl font-black text-[15px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              Bắt đầu bài thi ngay 
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cột phải: Sidebar (4 cột) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
               <Info className="w-12 h-12 text-blue-600" />
             </div>
             <h3 className="text-[13px] font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Info className="w-4 h-4" />
                Quy định phòng thi
             </h3>
             <ul className="space-y-4">
               {[
                 "Mỗi câu hỏi có giới hạn thời gian (30-60s).",
                 "Hệ thống tự động nộp bài khi hết giờ.",
                 "Không thể quay lại câu hỏi trước đó.",
                 "Cần đảm bảo micro hoạt động tốt."
               ].map((text, i) => (
                 <li key={i} className="flex items-start gap-3 text-[12px] text-slate-500 font-medium leading-relaxed">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                   {text}
                 </li>
               ))}
             </ul>
          </div>

          {/* Lịch sử thi */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-[#E8ECF1] shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#4361EE]">
                   <History className="w-4 h-4" />
                </div>
                <h3 className="text-[14px] font-black text-[#1A1D2B] uppercase tracking-widest">Lịch sử thi</h3>
              </div>
              <button onClick={fetchHistory} className="text-[#4361EE] hover:underline text-[10px] font-black uppercase tracking-widest">Làm mới</button>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-16 bg-[#F8FAFC] animate-pulse rounded-xl" />)
              ) : history.length === 0 ? (
                <div className="p-10 text-center bg-[#F8FAFC] border-2 border-dashed border-[#E8ECF1] rounded-2xl">
                   <p className="text-[12px] text-[#94A3B8] font-bold">Chưa có lịch sử thi</p>
                </div>
              ) : (
                history.slice(0, 5).map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => handleViewReport(item.id)}
                    className="w-full p-4 bg-[#F8FAFC] border-2 border-transparent rounded-2xl flex items-center justify-between hover:border-[#4361EE] hover:bg-white transition-all group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <BandBadge score={item.overall_band || 0} size="sm" />
                      <div>
                        <div className="text-[13px] font-black text-[#1A1D2B] group-hover:text-[#4361EE] transition-colors">{item.mode} Mock Test</div>
                        <div className="text-[10px] text-[#94A3B8] font-bold flex items-center gap-1.5">
                           <Calendar size={12} className="text-[#4361EE]" /> {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#CBD5E1] group-hover:text-[#4361EE] transition-colors" />
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <TestSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStart={startTest}
        initialMode={selectedMode}
      />
    </div>
  );
}
