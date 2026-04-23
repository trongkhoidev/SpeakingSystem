import { useState, useEffect, useCallback } from 'react';
import {
  Settings2, Plus, ChevronRight, Calendar, Award,
  Zap, FileText, TrendingUp, History, ArrowRight, Lightbulb,
  Clock, Target, Sparkles, BookOpen, Info
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
      const res = await api.post('/test/start', { mode: selectedMode, ...config });
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
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="space-y-3">
         <h1 className="text-[32px] font-bold text-[#1A1D2B] font-heading tracking-tight">IELTS Mock Test</h1>
         <p className="text-[15px] text-[#6B7280]">Trải nghiệm cảm giác thi thật với các bộ đề được chuẩn bị sẵn và áp lực thời gian.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Mode Toggle */}
          <div className="flex bg-[#F0F2F5] p-1 rounded-xl w-fit">
            <button 
              onClick={() => setTestMode('sets')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all",
                testMode === 'sets' ? "bg-white text-[#4361EE] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"
              )}
            >
              Chọn bộ đề
            </button>
            <button 
              onClick={() => setTestMode('random')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all",
                testMode === 'random' ? "bg-white text-[#4361EE] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"
              )}
            >
              Ngẫu nhiên
            </button>
          </div>

          {testMode === 'sets' ? (
            <div className="grid grid-cols-1 gap-4">
              {loadingExamSets ? (
                [1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)
              ) : (
                examSets.map(set => (
                  <button 
                    key={set.id}
                    onClick={() => setSelectedExamSetId(set.id)}
                    className={cn(
                      "group p-6 bg-white border rounded-2xl flex items-center justify-between transition-all text-left shadow-sm",
                      selectedExamSetId === set.id ? "border-[#4361EE] ring-1 ring-[#4361EE]" : "border-[#E8ECF1] hover:border-[#4361EE]/50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        set.difficulty === 'easy' ? "bg-[#E6F9F0] text-[#1A8F5C]" :
                        set.difficulty === 'hard' ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#EEF0FD] text-[#4361EE]"
                      )}>
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-[#1A1D2B] mb-1">{set.name}</div>
                        <div className="text-[13px] text-[#6B7280] line-clamp-1 mb-2">{set.description}</div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" /> {set.estimated_minutes} phút
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                            set.difficulty === 'easy' ? "bg-[#E6F9F0] text-[#1A8F5C]" :
                            set.difficulty === 'hard' ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#EEF0FD] text-[#4361EE]"
                          )}>
                            {set.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedExamSetId === set.id ? "border-[#4361EE] bg-[#4361EE]" : "border-[#E8ECF1]"
                    )}>
                      {selectedExamSetId === set.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
               {EXAM_MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => openSetup(mode.id)}
                    className="group card p-6 text-left hover:border-[#4361EE] transition-all"
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", mode.iconBg)}>
                       <mode.icon size={22} color={mode.iconColor} />
                    </div>
                    <h3 className="text-[16px] font-bold text-[#1A1D2B] mb-1">{mode.title}</h3>
                    <p className="text-[12px] text-[#6B7280] leading-relaxed line-clamp-2">{mode.description}</p>
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
            className="btn btn-primary w-full py-4 h-14 text-[15px] font-bold shadow-xl shadow-indigo-100"
          >
            Bắt đầu bài thi ngay <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 border-none shadow-lg space-y-4">
             <p className="section-title flex items-center gap-2">
               <Info className="w-4 h-4 text-[#4361EE]" /> Quy định thi thử
             </p>
             <ul className="space-y-3">
               {[
                 "Mỗi câu hỏi có giới hạn thời gian (30-60s).",
                 "Hệ thống tự động nộp bài khi hết giờ.",
                 "Không thể quay lại câu hỏi trước đó.",
                 "Cần đảm bảo micro hoạt động tốt."
               ].map((text, i) => (
                 <li key={i} className="flex items-start gap-2 text-[13px] text-[#6B7280]">
                   <div className="w-1.5 h-1.5 bg-[#4361EE] rounded-full mt-1.5 flex-shrink-0" />
                   {text}
                 </li>
               ))}
             </ul>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0">Lịch sử thi</p>
              <button onClick={fetchHistory} className="text-[#4361EE] hover:underline text-[12px] font-bold uppercase tracking-wider">Làm mới</button>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)
              ) : history.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-[#E8ECF1] rounded-2xl">
                   <p className="text-[12.5px] text-[#9CA3AF]">Chưa có lịch sử thi</p>
                </div>
              ) : (
                history.slice(0, 5).map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleViewReport(item.id)}
                    className="card p-4 flex items-center justify-between cursor-pointer hover:border-[#4361EE] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <BandBadge score={item.overall_band || 0} size="sm" />
                      <div>
                        <div className="text-[14px] font-bold text-[#1A1D2B]">{item.mode} Test</div>
                        <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
                           <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#E8ECF1]" />
                  </div>
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
