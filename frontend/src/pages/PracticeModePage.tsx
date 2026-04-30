import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  History,
  Mic,
  ChevronLeft,
  Volume2,
  ChevronRight,
  Info,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Sparkles,
  Layout,
  BookOpen,
  Clock,
  X,
  Zap,
  AlertCircle,
  HelpCircle,
  Star
} from 'lucide-react';
import { TestFeedbackPanel } from '../components/test/TestFeedbackPanel';
import api from '../lib/api';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { AudioRecorder } from '../components/audio/AudioRecorder';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { AssessmentLoading } from '../components/feedback/AssessmentLoading';
import { resampleAndConvertToWav } from '@/lib/audio';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('vi-VN');

  const d2 = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (!isNaN(d2.getTime())) return d2.toLocaleDateString('vi-VN');

  return String(dateStr).split(' ')[0] || 'N/A';
};

const formatTitle = (title: string) => {
  if (!title) return 'Practice Session';
  return title.replace(/Luy\?n t\?p/g, 'Luyện tập');
};

export function PracticeModePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [view, setView] = useState<'input' | 'practice' | 'finish'>('input');
  const [sessionTitle, setSessionTitle] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [curatedTopics, setCuratedTopics] = useState<CuratedTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

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

  const handleRecordingComplete = async (blob: Blob) => {
    setIsRecording(false);
    setIsProcessingAudio(true);
    const q = questions[activeIndex];
    try {
      const formData = new FormData();
      formData.append('audio_file', blob, 'recording.webm');
      formData.append('question_id', q.id);
      formData.append('question_text', q.question_text);
      if (user) {
        formData.append('user_id', user.id);
      }
      formData.append('custom_question_id', q.id);

      const response = await api.post('/speech/assess', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setQuestions(prev => prev.map((item, idx) =>
        idx === activeIndex
          ? { ...item, status: 'answered', feedback: response.data, overall_band: response.data.overall_band }
          : item
      ));
      
      // Refresh tokens in navbar real-time
      window.dispatchEvent(new CustomEvent('refresh-tokens'));
      
      toast.success('Đánh giá hoàn tất!');
    } catch (error: any) {
      if (error.response?.status === 403 && user?.role === 'guest') {
        setIsLimitReached(true);
      } else {
        const msg = error.response?.data?.detail || 'Đã có lỗi, vui lòng thử lại.';
        toast.error('Lỗi đánh giá', { description: msg });
      }
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isTokenRequired, setIsTokenRequired] = useState(false);

  useEffect(() => {
    const handleTrialLimit = () => setIsLimitReached(true);
    const handleTokenRequired = () => setIsTokenRequired(true);

    window.addEventListener('trial-limit-reached', handleTrialLimit);
    window.addEventListener('insufficient-tokens', handleTokenRequired);

    return () => {
      window.removeEventListener('trial-limit-reached', handleTrialLimit);
      window.removeEventListener('insufficient-tokens', handleTokenRequired);
    };
  }, []);

  const handleStreamUpdate = (newStream: MediaStream) => {
    setStream(newStream);
    setIsRecording(true);
  };

  // TTS
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (view === 'practice' && questions[activeIndex] && !isRecording && !isProcessingAudio) {
      const q = questions[activeIndex];
      if (q.status === 'pending') {
        const timer = setTimeout(() => speakText(q.question_text), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [view, activeIndex, isRecording, isProcessingAudio, questions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'practice' || isRecording || isProcessingAudio) return;

      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && activeIndex < questions.length - 1) {
        setActiveIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, activeIndex, questions.length, isRecording, isProcessingAudio]);

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

    setIsStarting(true);
    try {
      const res = await api.post('/practice/session', {
        title: sessionTitle || DEFAULT_TITLE(),
        questions: processedQuestions
      });

      const sessionData = res.data;
      setQuestions(sessionData.questions.map((q: any) => ({
        ...q,
        status: 'pending'
      })));
      setActiveIndex(0);
      setView('practice');
    } catch (e) {
      toast.error('Lỗi khi khởi tạo buổi học');
    } finally {
      setIsStarting(false);
    }
  };

  const loadSession = async (session: Session) => {
    try {
      const res = await api.get(`/practice/sessions/${session.id}/questions`);
      setQuestions(res.data);
      setSessionTitle(session.title);
      setActiveIndex(0);
      setView('practice');
    } catch (e) {
      toast.error('Không thể tải dữ liệu buổi học');
    }
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();

    // Optimistic UI: Update state immediately
    const previousSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    try {
      await api.delete(`/practice/sessions/${sessionId}`);
      toast.success('Đã xoá lịch sử luyện tập');
    } catch (e) {
      // Rollback on failure
      setSessions(previousSessions);
      toast.error('Xoá thất bại. Vui lòng thử lại sau.');
    }
  };

  const [trialStatus, setTrialStatus] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'guest') {
      api.get('/speech/trial-status').then(res => setTrialStatus(res.data)).catch(console.error);
    }
  }, [user, questions]); // Re-fetch when questions change (after assessment)

  // Renderers
  if (view === 'input') {
    return (
      <div className="w-full max-w-[1600px] mx-auto p-6 md:p-10 space-y-10 animate-in fade-in duration-500 bg-slate-50 min-h-screen">

        {/* ── HEADER ── */}
        <header className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-900 opacity-80" />
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-blue-50 text-blue-900 text-[11px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                Luyện theo chủ đề
              </span>
              {user?.role === 'guest' && trialStatus && (
                <span className="px-4 py-1.5 bg-amber-50 text-amber-600 text-[11px] font-black uppercase tracking-widest rounded-full border border-amber-100 flex items-center gap-2">
                  <Zap className="w-3 h-3 fill-current" />
                  Trial: {trialStatus.remaining_points}/{trialStatus.total_points} points
                </span>
              )}
            </div>

            <div className="flex items-center gap-5 w-full">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900 shrink-0 shadow-inner">
                <Layout className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest opacity-60">Tên chủ đề</p>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-[18px] font-black text-slate-900 focus:ring-0 placeholder-slate-300"
                  placeholder={`Nhập tên chủ đề luyện tập (mặc định: ${DEFAULT_TITLE()})`}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end ml-auto">
            <button
              onClick={handleStartPractice}
              disabled={isStarting}
              className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-800 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-3"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  Bắt đầu luyện tập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8 items-start">
          <main className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden min-h-[550px] flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-widest">Nội dung luyện tập</h3>
                    <p className="text-[12px] text-slate-400 font-medium">Nhập câu hỏi hoặc chọn từ danh sách bên phải</p>
                  </div>
                </div>
              </div>

              <textarea
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Nhập các câu hỏi bạn muốn luyện tập tại đây... mỗi câu một dòng"
                className="flex-1 w-full p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 focus:border-blue-400 focus:bg-white transition-all text-[18px] font-medium leading-relaxed placeholder:text-slate-300 resize-none"
              />
            </div>
          </main>

          <aside className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Gần đây
                </h4>
                <button
                  onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                >
                  <ChevronRight className={cn("w-4 h-4 transition-transform", isHistoryCollapsed ? "rotate-90" : "-rotate-90")} />
                </button>
              </div>

              {!isHistoryCollapsed && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  {loadingSessions ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
                    </div>
                  ) : sessions.length > 0 ? (
                    sessions.map(s => (
                      <div key={s.id} className="relative group/session">
                        <button
                          onClick={() => loadSession(s)}
                          className="w-full text-left p-5 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-blue-100 border border-slate-100 rounded-2xl transition-all group"
                        >
                          <p className="text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 pr-6">{formatTitle(s.title)}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{formatDate(s.started_at)}</p>
                        </button>
                        <button
                          onClick={(e) => deleteSession(e, s.id)}
                          className="absolute top-4 right-4 p-2 opacity-0 group-hover/session:opacity-100 hover:bg-red-50 hover:text-red-600 text-slate-300 rounded-lg transition-all"
                          title="Xoá lịch sử"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-slate-400 font-medium text-center py-6 italic">Chưa có dữ liệu</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl space-y-6">
              <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Chủ đề gợi ý
              </h4>
              <div className="space-y-3">
                {loadingTopics ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
                  </div>
                ) : curatedTopics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSessionTitle(topic.name);
                      setQuestionInput(topic.questions.map(q => q.question_text).join('\n'));
                    }}
                    className="w-full text-left p-5 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-blue-100 border border-slate-100 rounded-2xl transition-all"
                  >
                    <p className="text-[14px] font-black text-slate-900 mb-1">{topic.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{topic.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (view === 'practice') {
    const q = questions[activeIndex];
    const progress = ((activeIndex + 1) / questions.length) * 100;

    return (
      <div className="relative w-full min-h-screen bg-white flex flex-col overflow-hidden font-sans">

        {/* HEADER */}
        <header className="px-8 py-6 flex items-center justify-between z-20">
          <button
            onClick={() => setView('input')}
            className="w-12 h-12 flex items-center justify-center text-slate-900 hover:bg-slate-100 rounded-full transition-all group"
          >
            <ChevronLeft strokeWidth={3} className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-6">
            <span className="text-[15px] font-bold text-slate-900">Tiến độ hiện tại</span>
            <span className="text-[15px] font-bold text-slate-900 w-12 text-center">{activeIndex + 1}/{questions.length}</span>
            <div className="w-64 h-2.5 rounded-full overflow-hidden border border-slate-900 bg-white">
              <div className="h-full bg-slate-900 transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all font-bold text-[12px] uppercase tracking-wider"
          >
            <History className="w-4 h-4" />
            XEM LỊCH SỬ ({questions.filter(i => i.status === 'answered').length})
          </button>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full px-8 pt-8 md:pt-16 pb-12 flex justify-center items-start">
          
          <div className="relative w-full max-w-6xl flex justify-center">
            {/* LEFT ARROW */}
            <button
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex(prev => prev - 1)}
              className="absolute left-0 lg:left-4 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center text-slate-900 disabled:opacity-10 hover:scale-110 transition-all z-10"
            >
              <ChevronLeft strokeWidth={4} className="w-16 h-16" />
            </button>

            {/* CENTRAL BORDERED CARD */}
            <div className="w-full max-w-4xl min-h-[450px] border-[2px] border-slate-900 rounded-[3rem] bg-white relative z-10 flex flex-col items-center justify-center p-12 shadow-sm">

            <div className="text-center space-y-10 w-full">
              {/* Speaker Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => speakText(q.question_text)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all group border border-slate-100"
                >
                  <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-[28px] md:text-[34px] font-black text-slate-900 leading-[1.3] max-w-2xl mx-auto">
                "{q.question_text}"
              </h2>

              {/* Assessment / Recording Area */}
              <div className="min-h-[160px] flex flex-col justify-center items-center py-2 transition-all duration-500">
                {isProcessingAudio ? (
                  <div className="w-full flex justify-center py-4">
                    <AssessmentLoading />
                  </div>
                ) : q.status === 'pending' ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex flex-col items-center gap-1">
                      {stream && isRecording && (
                        <WaveformVisualizer stream={stream} isRecording={isRecording} className="w-64 h-12 mb-1" />
                      )}
                      <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        onStreamUpdate={handleStreamUpdate}
                        onTranscriptUpdate={setLiveTranscript}
                      />
                    </div>

                    <AnimatePresence>
                      {isRecording && liveTranscript && (
                        <div className="w-full max-w-lg px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center mt-4">
                           <p className="text-[17px] leading-relaxed font-semibold text-slate-700 italic">
                             "{liveTranscript}"
                           </p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="mt-8">
                    <TestFeedbackPanel
                      feedback={{
                        ...q.feedback,
                        overall_band: q.overall_band,
                        thought_process: q.feedback.thought_process,
                        content_errors: q.feedback.content_errors
                      }}
                      questionText={q.question_text}
                      footer={(
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => setQuestions(prev => prev.map((item, idx) => idx === activeIndex ? { ...item, status: 'pending' } : item))}
                            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95"
                          >
                            Luyện tập lại
                          </button>
                          <button
                            onClick={() => {
                              if (activeIndex < questions.length - 1) setActiveIndex(prev => prev + 1);
                              else setView('finish');
                            }}
                            className="px-8 py-3 bg-blue-900 text-white rounded-xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                          >
                            {activeIndex < questions.length - 1 ? (
                              <>
                                Câu tiếp theo
                                <ChevronRight className="w-4 h-4" />
                              </>
                            ) : (
                              'Hoàn tất buổi học'
                            )}
                          </button>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT ARROW */}
          <button
            disabled={activeIndex === questions.length - 1}
            onClick={() => setActiveIndex(prev => prev + 1)}
            className="absolute right-0 lg:right-4 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center text-slate-900 disabled:opacity-10 hover:scale-110 transition-all z-10"
          >
            <ChevronRight strokeWidth={4} className="w-16 h-16" />
          </button>
          
          </div>
        </main>
      </div>

    );
  }

  if (view === 'finish') {
    const avgBand = (questions.reduce((acc, q) => acc + (q.overall_band || 0), 0) / (questions.length || 1)).toFixed(1);

    return (
      <div className="relative w-full min-h-screen bg-white flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-5xl bg-white p-12 md:p-20 text-center space-y-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

          <div className="space-y-6">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto rotate-12 shadow-lg shadow-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="space-y-3">
              <h1 className="text-[36px] md:text-[52px] font-black text-slate-900 tracking-tight">Tuyệt vời! Bạn đã hoàn thành</h1>
              <p className="text-[18px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Bạn đã hoàn thành <b>{questions.length}</b> câu hỏi luyện tập. AI đã tính toán điểm số trung bình của bạn dựa trên toàn bộ các câu trả lời:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-10">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/10 blur-[120px] rounded-full" />
              <div className="relative bg-white border-[12px] border-slate-50 w-56 h-56 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center mx-auto shadow-2xl">
                <div className="text-[80px] md:text-[110px] font-black text-blue-600 leading-none tracking-tighter">{avgBand}</div>
                <div className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em] mt-4">Average Band</div>
              </div>
            </div>

            <div className="text-left space-y-10">
              <div className="space-y-6">
                <p className="text-[12px] font-black text-blue-600 uppercase tracking-widest">Điểm mạnh & Cải thiện</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-5 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[16px] font-black text-slate-900">Fluency Performance</p>
                      <p className="text-[14px] text-slate-500 font-medium">Khả năng diễn đạt trôi chảy đạt mức ổn định.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-600 border border-purple-50">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[16px] font-black text-slate-900">Vocabulary Range</p>
                      <p className="text-[14px] text-slate-500 font-medium">Đã sử dụng các cụm từ academic hiệu quả.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center pt-10 border-t border-slate-100">
            <button
              onClick={() => setView('input')}
              className="px-12 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-[15px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
            >
              Về trang chủ đề
            </button>
            <button
              onClick={() => { setQuestionInput(''); setView('input'); }}
              className="px-12 py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-[1.75rem] font-black text-[15px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              Bắt đầu bài học mới
            </button>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-100 max-w-lg mx-auto space-y-6">
            <div className="space-y-2">
              <h4 className="text-[15px] font-black text-slate-900">Bạn thấy bài học này thế nào?</h4>
              <p className="text-[12px] text-slate-400 font-medium">Ý kiến của bạn giúp AI cải thiện độ chính xác.</p>
            </div>

            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={async () => {
                    try {
                      await api.post('/admin/feedback', {
                        rating: star,
                        category: 'practice_session',
                        comment: `Session ${sessionTitle} finished with band ${avgBand}`
                      });
                      toast.success('Cảm ơn bạn đã phản hồi!');
                    } catch (e) {
                      toast.error('Không thể gửi phản hồi');
                    }
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-amber-50 hover:text-amber-500 hover:scale-110 transition-all border border-slate-100"
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {/* MODAL: HẾT LƯỢT DÙNG THỬ (GUEST) */}
        {isLimitReached && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
              
              <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto text-amber-600 rotate-3 shadow-inner">
                <Zap className="w-12 h-12 fill-current animate-pulse" />
              </div>

              <div className="space-y-3">
                <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Hết lượt dùng thử!</h2>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                  Bạn đã khám phá hết các tính năng dành cho khách. Hãy đăng nhập để tiếp tục luyện tập, lưu lịch sử bài nói và nhận thêm 💎 miễn phí mỗi ngày nhé!
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <GoogleLoginButton />
                <button
                  onClick={() => setIsLimitReached(false)}
                  className="w-full py-4 text-slate-400 text-[13px] font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
                >
                  Để sau
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: HẾT TOKEN (REGISTERED USER) */}
        {isTokenRequired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-blue-600 -rotate-3 shadow-inner">
                <Sparkles className="w-12 h-12 fill-current" />
              </div>

              <div className="space-y-3">
                <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Hết 💎 luyện tập!</h2>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                  Hệ thống cần 💎 để thực hiện đánh giá AI chuyên sâu. Bạn có thể nâng cấp gói hội viên hoặc đợi nhận 💎 miễn phí vào ngày mai.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <button
                  onClick={() => navigate('/plans')}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
                >
                  <BarChart3 className="w-5 h-5" />
                  Nâng cấp gói ngay
                </button>
                <button
                  onClick={() => setIsTokenRequired(false)}
                  className="w-full py-4 text-slate-400 text-[13px] font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[14px] flex items-center gap-3">
                  <History className="w-5 h-5 text-blue-600" />
                  Lịch sử bài nói
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {questions.filter(item => item.status === 'answered').length > 0 ? (
                  questions.filter(item => item.status === 'answered').map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 hover:bg-white hover:shadow-lg transition-all cursor-pointer" onClick={() => { setActiveIndex(questions.findIndex(q => q.id === item.id)); setShowHistory(false); }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Câu {idx + 1}</span>
                        <span className="text-[12px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Band {item.overall_band?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">"{item.question_text}"</p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <History className="w-12 h-12" />
                    <p className="text-[14px] font-bold">Chưa có bài nói nào được hoàn thành</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
