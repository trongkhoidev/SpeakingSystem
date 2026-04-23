import { useEffect, useState, useCallback } from 'react';
import { 
  Plus, 
  History, 
  Mic, 
  Play, 
  ChevronLeft, 
  Volume2, 
  ChevronRight, 
  Calendar, 
  Trash2,
  Info,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Sparkles,
  Layout,
  BookOpen,
  CheckCircle,
  Clock,
  Settings,
  Zap
} from 'lucide-react';
import api from '../lib/api';
import { RecordingModal } from '../components/audio/RecordingModal';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ModeCard } from '../components/practice/ModeCard';
import { QuestionDisplay } from '../components/practice/QuestionDisplay';
import { RecordingControl } from '../components/practice/RecordingControl';
import { PracticeResultsSummary } from '../components/practice/PracticeResultsSummary';
import { PracticeTips } from '../components/practice/PracticeTips';

interface Session {
  id: string;
  title: string;
  started_at: string;
  question_count: number;
  answer_count: number;
  avg_band: number;
}

interface Question {
  id: string;
  question_text: string;
  part: number;
  status: 'pending' | 'answered';
  feedback?: any;
  overall_band?: number;
}
 
interface CuratedTopic {
  id: string;
  name: string;
  part: number;
  description: string;
  questions: {
    id: string;
    question_text: string;
  }[];
}

const DEFAULT_TITLE = () => `Luyện tập ngày ${new Date().toLocaleDateString('vi-VN')}`;

const TIPS: Record<number, string> = {
  1: "Part 1: Trả lời ngắn gọn (2-3 câu). Tập trung vào sự tự nhiên và trôi chảy.",
  2: "Part 2: Bạn có 1 phút chuẩn bị và 2 phút nói. Sử dụng các từ nối để bài nói mạch lạc.",
  3: "Part 3: Thảo luận chuyên sâu. Hãy mở rộng câu trả lời bằng lý do và ví dụ thực tế."
};

export function PracticeModePage() {
  const { user } = useAuth();
  
  // State
  const [view, setView] = useState<'input' | 'practice' | 'finish'>('input');
  const [sessionTitle, setSessionTitle] = useState(DEFAULT_TITLE());
  const [questionInput, setQuestionInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [curatedTopics, setCuratedTopics] = useState<CuratedTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{ id: string; question_text: string } | null>(null);

  // Load history
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/practice/sessions');
      setSessions(res.data);
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const fetchCuratedTopics = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const res = await api.get('/practice/topics');
      setCuratedTopics(res.data);
    } catch (e) {
      console.error('Failed to fetch topics:', e);
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'input') {
      fetchSessions();
      fetchCuratedTopics();
    }
  }, [view, fetchSessions, fetchCuratedTopics]);

  // TTS
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (view === 'practice' && questions[activeIndex] && !isRecordingModalOpen) {
      const q = questions[activeIndex];
      if (q.status === 'pending') {
        const timer = setTimeout(() => speakText(q.question_text), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [view, activeIndex, isRecordingModalOpen, questions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'practice' || isRecordingModalOpen) return;
      
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && activeIndex < questions.length - 1) {
        setActiveIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, activeIndex, questions.length, isRecordingModalOpen]);

  // Actions
  const handleStartPractice = async () => {
    if (!questionInput.trim()) {
      toast.warning('Vui lòng nhập ít nhất một câu hỏi');
      return;
    }

    const lines = questionInput.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3);

    if (lines.length === 0) {
      toast.warning('Câu hỏi quá ngắn hoặc không hợp lệ');
      return;
    }

    const processedQuestions = lines.map(text => {
      let part = 1;
      const lower = text.toLowerCase();
      if (lower.includes('part 2') || lower.includes('describe a') || lower.includes('describe an')) part = 2;
      if (lower.includes('part 3')) part = 3;
      const cleanText = text.replace(/^(\d+[.):\-]\s*|part\s*\d+:?\s*)/i, '').trim() || text;
      return { text: cleanText, part };
    });

    try {
      const res = await api.post('/practice/session', {
        title: sessionTitle,
        questions: processedQuestions
      });
      
      const sessionData = res.data;
      setActiveSessionId(sessionData.id);
      setQuestions(sessionData.questions.map((q: any) => ({
        ...q,
        status: 'pending'
      })));
      setActiveIndex(0);
      setView('practice');
    } catch (e) {
      toast.error('Lỗi khi khởi tạo buổi học');
    }
  };

  const loadSession = async (session: Session) => {
    try {
      const res = await api.get(`/practice/sessions/${session.id}/questions`);
      setQuestions(res.data);
      setActiveSessionId(session.id);
      setSessionTitle(session.title);
      setActiveIndex(0);
      setView('practice');
    } catch (e) {
      toast.error('Không thể tải dữ liệu buổi học');
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa buổi học này?')) return;
    try {
      await api.delete(`/practice/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Đã xóa buổi học');
    } catch (e) {
      toast.error('Không thể xóa buổi học');
    }
  };

  // Renderers
  if (view === 'input') {
    return (
      <div className="flex flex-col gap-8 page-enter">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Practice <span className="text-blue-600">Speaking</span>
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Improve your IELTS Speaking skills by practicing with specific questions. Get instant AI-powered feedback on pronunciation, fluency, grammar, and vocabulary.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Practice Mode Selection */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-600" />
                Choose Your Practice Mode
              </h2>
              <div className="space-y-2">
                <ModeCard
                  icon={Settings}
                  title="Custom Questions"
                  description="Enter your own questions or paste from any source. Perfect for targeted practice."
                  isSelected={true}
                />
              </div>
            </div>

            {/* Setup Form */}
            <div className="bg-white rounded-2xl p-8 space-y-6 border border-gray-200 shadow-sm">
              {/* Session Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  Session Title
                </label>
                <input 
                  type="text" 
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 text-sm font-medium transition-all outline-none"
                  placeholder="e.g., Daily Practice"
                />
              </div>
 
              {/* Questions Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Questions ({questionInput.split('\n').filter(l => l.trim()).length})
                </label>
                <div className="relative group">
                  <textarea 
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-4 text-sm leading-relaxed transition-all outline-none min-h-[280px] resize-none font-mono"
                    placeholder={'Each question on a new line...\nDescribe a person who has influenced you.\nWhat do you like to do in your free time?'}
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-xs font-medium px-1">
                  <Info className="w-3.5 h-3.5" />
                  The system automatically detects IELTS Part 1, 2, and 3 from your questions.
                </div>
              </div>
 
              {/* Start Button */}
              <button 
                onClick={handleStartPractice}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                Start Practice <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
 
          {/* Side Panels */}
          <div className="space-y-6">
            {/* Suggested Topics */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Suggested Topics
              </h3>
              
              {loadingTopics ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {curatedTopics.map(topic => (
                    <button 
                      key={topic.id}
                      onClick={() => {
                        const questionsText = topic.questions.map(q => q.question_text).join('\n');
                        setQuestionInput(questionsText);
                        setSessionTitle(`${topic.name} Practice`);
                        toast.success(`Selected: ${topic.name}`);
                      }}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                          topic.part === 1 ? "bg-blue-100 text-blue-600" : 
                          topic.part === 2 ? "bg-amber-100 text-amber-600" : "bg-purple-100 text-purple-600"
                        )}>
                          P{topic.part}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                          <p className="text-xs text-gray-500">{topic.questions.length} questions</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Recent Sessions
              </h3>
              
              {loadingSessions ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                  <p className="text-sm text-gray-600">No sessions yet. Start your first practice!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessions.slice(0, 5).map(s => (
                    <button 
                      key={s.id}
                      onClick={() => loadSession(s)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{new Date(s.started_at).toLocaleDateString()}</span>
                          <span className={cn(
                            "flex items-center gap-0.5 ml-1",
                            s.answer_count === s.question_count ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {s.answer_count === s.question_count ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {s.answer_count}/{s.question_count}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {s.avg_band > 0 && (
                          <div className="px-2 py-1 bg-blue-100 rounded text-xs font-bold text-blue-600 flex-shrink-0">
                            {s.avg_band.toFixed(1)}
                          </div>
                        )}
                        <button 
                          onClick={(e) => deleteSession(e, s.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>
                  ))}
                  {sessions.length > 5 && (
                    <button className="w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-700">
                      View all ({sessions.length} sessions)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'practice' && questions.length > 0) {
    const q = questions[activeIndex];
    const avgBand = questions.filter(q => q.status === 'answered').reduce((acc, q) => acc + (q.overall_band || 0), 0) / 
                     (questions.filter(q => q.status === 'answered').length || 1);

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => {
                if (confirm('Exit practice session?')) setView('input');
              }}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Exit
            </button>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-700">
                {activeIndex + 1} of {questions.length}
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((activeIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-sm font-semibold text-blue-600">
              Avg: {avgBand.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl space-y-6">
            {/* Question Display */}
            <div className="bg-white rounded-2xl p-8 space-y-8 border border-gray-200 shadow-sm">
              {/* Question Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold text-white",
                    q.part === 1 ? "bg-blue-600" : q.part === 2 ? "bg-amber-600" : "bg-purple-600"
                  )}>
                    Part {q.part}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{sessionTitle}</span>
                </div>
                <button 
                  onClick={() => speakText(q.question_text)}
                  className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                  "{q.question_text}"
                </h2>
                {q.part === 2 && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-left">
                    <p className="text-xs font-bold text-amber-900 uppercase mb-2 tracking-wide">Cue Card Points:</p>
                    <ul className="text-sm text-amber-900 list-disc pl-5 space-y-1">
                      <li>Describe this topic in detail</li>
                      <li>Explain why it is important</li>
                      <li>Give your personal opinion</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Response Area */}
              <div className="pt-4 border-t border-gray-200">
                {q.status === 'pending' ? (
                  <div className="space-y-6">
                    <button 
                      onClick={() => {
                        setSelectedQuestion({ id: q.id, question_text: q.question_text });
                        setIsRecordingModalOpen(true);
                      }}
                      className="w-full py-6 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
                    >
                      <Mic className="w-5 h-5" />
                      Start Recording
                    </button>
                    <div className="flex gap-3">
                      <button
                        disabled={activeIndex === 0}
                        onClick={() => setActiveIndex(prev => prev - 1)}
                        className={cn(
                          "flex-1 py-2 rounded-lg font-semibold border-2 transition-all",
                          activeIndex === 0
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        Previous
                      </button>
                      <button
                        disabled={activeIndex === questions.length - 1}
                        onClick={() => setActiveIndex(prev => prev + 1)}
                        className={cn(
                          "flex-1 py-2 rounded-lg font-semibold border-2 transition-all",
                          activeIndex === questions.length - 1
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Score Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-100 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-blue-600">{q.overall_band?.toFixed(1)}</div>
                        <div className="text-xs font-bold text-blue-700 uppercase mt-1 tracking-wide">Overall</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="text-xl font-bold text-gray-900">{q.feedback?.band_scores?.FC || '-'}</div>
                        <div className="text-xs font-bold text-gray-600 uppercase mt-1 tracking-wide">Fluency</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="text-xl font-bold text-gray-900">{q.feedback?.band_scores?.LR || '-'}</div>
                        <div className="text-xs font-bold text-gray-600 uppercase mt-1 tracking-wide">Vocabulary</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="text-xl font-bold text-gray-900">{q.feedback?.band_scores?.PRON || '-'}</div>
                        <div className="text-xs font-bold text-gray-600 uppercase mt-1 tracking-wide">Pronunciation</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setQuestions(prev => prev.map((item, idx) => idx === activeIndex ? {...item, status: 'pending'} : item))}
                        className="flex-1 py-2 rounded-lg font-semibold bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        Retry
                      </button>
                      <button 
                        onClick={() => {
                          if (activeIndex < questions.length - 1) setActiveIndex(prev => prev + 1);
                          else setView('finish');
                        }}
                        className="flex-1 py-2 rounded-lg font-semibold bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 transition-all"
                      >
                        {activeIndex < questions.length - 1 ? 'Next' : 'Finish'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <PracticeTips part={q.part} />
          </div>
        </main>

        <RecordingModal 
          isOpen={isRecordingModalOpen}
          onClose={() => setIsRecordingModalOpen(false)}
          question={selectedQuestion}
          onSuccess={(result) => {
            setQuestions(prev => prev.map((q, idx) => 
              idx === activeIndex 
                ? { ...q, status: 'answered', feedback: result, overall_band: result.overall_band } 
                : q
            ));
            setIsRecordingModalOpen(false);
          }}
        />
      </div>
    );
  }

  if (view === 'finish') {
    const avgBand = (questions.reduce((acc, q) => acc + (q.overall_band || 0), 0) / questions.length).toFixed(1);
    const results = questions.map(q => ({
      questionId: q.id,
      questionText: q.question_text,
      part: q.part,
      overallBand: q.overall_band,
      fluency: q.feedback?.band_scores?.FC,
      coherence: q.feedback?.band_scores?.CC,
      grammar: q.feedback?.band_scores?.GR,
      vocabulary: q.feedback?.band_scores?.LR,
    }));

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <PracticeResultsSummary
            results={results}
            sessionTitle={sessionTitle}
            onContinue={() => setView('input')}
            onDownload={() => {
              // TODO: Implement PDF export
              toast.success('Download feature coming soon!');
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}
