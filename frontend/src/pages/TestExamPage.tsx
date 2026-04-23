import { useState, useEffect, useCallback } from 'react';
import {
  Settings2, Plus, ChevronRight, Calendar, Award,
  Zap, FileText, TrendingUp, History, ArrowRight, Lightbulb,
  Clock, Target, Sparkles, BookOpen, Info, CheckCircle
} from 'lucide-react';
import { TestWizardModal, TestWizardConfig } from '../components/test/TestWizardModal';
import { TestRunner } from '../components/test/TestRunner';
import { TestReport } from '../components/test/TestReport';
import { BandBadge } from '../components/shared/BandBadge';
import { ExamModeCard } from '../components/test/ExamModeCard';
import { TestPerformanceCard } from '../components/test/TestPerformanceCard';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [testConfig, setTestConfig]         = useState<TestWizardConfig | null>(null);
  const [showReport, setShowReport]         = useState<any | null>(null);

  const [examSets, setExamSets]             = useState<ExamSet[]>([]);
  const [loadingExamSets, setLoadingExamSets] = useState(false);
  const [selectedExamSetId, setSelectedExamSetId] = useState<string | null>(null);

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

  const startTest = async (config: TestWizardConfig) => {
    try {
      const res = await api.post('/test/start', { mode: config.mode, ...config });
      setActiveSession(res.data.session);
      setQuestions(res.data.questions);
      setTestConfig(config);
      setIsSetupOpen(false);
    } catch (e) {
      console.error('Failed to start test:', e);
      toast.error('Failed to start test');
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">IELTS Mock Test</h1>
        <p className="text-gray-600 max-w-2xl">Experience a real exam environment with timed questions and instant AI feedback on your speaking performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Modes */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Choose Your Test Mode
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {EXAM_MODES.map(mode => (
                <ExamModeCard
                  key={mode.id}
                  id={mode.id}
                  icon={mode.icon}
                  title={mode.title}
                  description={mode.description}
                  duration="11-14 min"
                  iconColor={mode.iconColor}
                  accentColor={mode.accentColor}
                  onClick={() => openSetup(mode.id)}
                />
              ))}
            </div>
          </div>

          {/* Exam Sets */}
          {examSets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Practice Sets
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingExamSets ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  examSets.map(set => (
                    <button 
                      key={set.id}
                      onClick={() => {
                        setSelectedExamSetId(set.id);
                        startTest({
                          mode: 'full',
                          examinerVoice: 'female-uk',
                          questionCount: 5,
                          followUpEnabled: true,
                        });
                      }}
                      className={cn(
                        "w-full p-4 bg-white border-2 rounded-lg transition-all text-left",
                        selectedExamSetId === set.id 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-blue-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{set.name}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{set.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{set.estimated_minutes} minutes</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded font-semibold",
                              set.difficulty === 'easy' ? "bg-emerald-100 text-emerald-700" :
                              set.difficulty === 'hard' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {set.difficulty}
                            </span>
                          </div>
                        </div>
                        {selectedExamSetId === set.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Rules */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Test Rules
            </p>
            <ul className="space-y-3">
              {[
                "Each question has a time limit (30-60s)",
                "Auto-submit when time expires",
                "Cannot go back to previous questions",
                "Ensure microphone is working"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Tests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Recent Tests
              </p>
              <button onClick={fetchHistory} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Refresh
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />)}
                </div>
              ) : history.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-600">No test history yet. Start your first test!</p>
                </div>
              ) : (
                history.slice(0, 5).map((item) => (
                  <TestPerformanceCard
                    key={item.id}
                    test={{
                      id: item.id,
                      createdAt: item.created_at,
                      mode: item.mode,
                      overallBand: item.overall_band,
                    }}
                    onClick={() => handleViewReport(item.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <TestWizardModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStart={startTest}
        initialMode={selectedMode}
      />
    </div>
  );
}
