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
  Settings
} from 'lucide-react';
import api from '../lib/api';
import { RecordingModal } from '../components/audio/RecordingModal';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-bold text-[#1A1D2B] font-heading">
              Luyện tập <span className="text-[#4361EE]">theo câu</span>
            </h1>
            <p className="text-[13.5px] text-[#6B7280] mt-1 max-w-2xl">
              Cải thiện kỹ năng Speaking bằng cách luyện tập từng câu hỏi cụ thể. AI sẽ phân tích và phản hồi ngay lập tức.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card space-y-6 p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-[#4361EE]" /> Tên buổi học
                </label>
                <input 
                  type="text" 
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-[#E8ECF1] focus:border-[#4361EE] focus:ring-1 focus:ring-[#4361EE]/20 rounded-xl p-4 text-[14px] font-medium transition-all outline-none"
                  placeholder="Ví dụ: Daily Practice"
                />
              </div>
 
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" /> Danh sách câu hỏi
                </label>
                <div className="relative group">
                  <textarea 
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    className="w-full bg-[#F8F9FB] border border-[#E8ECF1] focus:border-[#4361EE] focus:ring-1 focus:ring-[#4361EE]/20 rounded-xl p-5 text-[14px] leading-relaxed transition-all outline-none min-h-[320px] resize-none font-mono"
                    placeholder="Mỗi câu hỏi một dòng...&#10;Describe a person who has influenced you.&#10;What do you like to do in your free time?"
                  />
                  <div className="absolute right-4 bottom-4 text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
                    {questionInput.split('\n').filter(l => l.trim()).length} câu hỏi
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#9CA3AF] text-[11px] font-medium px-1">
                  <Info className="w-3.5 h-3.5" />
                  Gợi ý: Hệ thống sẽ tự nhận diện Part 1, 2, 3 dựa trên câu hỏi.
                </div>
              </div>
 
              <button 
                onClick={handleStartPractice}
                className="btn btn-primary w-full py-4 text-[14px] shadow-indigo-200 h-14"
              >
                Bắt đầu luyện tập <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
 
          {/* Side Panels */}
          <div className="lg:col-span-2 space-y-8">
            {/* Topic Suggestions */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-1">
                  <p className="section-title mb-0 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" /> Chủ đề gợi ý
                  </p>
               </div>
               
               <div className="grid grid-cols-1 gap-3">
                 {loadingTopics ? (
                   [1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)
                 ) : (
                   curatedTopics.map(topic => (
                     <button 
                       key={topic.id}
                       onClick={() => {
                         const questionsText = topic.questions.map(q => q.question_text).join('\n');
                         setQuestionInput(questionsText);
                         setSessionTitle(`${topic.name} Practice`);
                         toast.success(`Đã chọn chủ đề: ${topic.name}`);
                       }}
                       className="group p-4 bg-white border border-[#E8ECF1] rounded-xl flex items-center justify-between hover:border-[#4361EE] hover:bg-[#F8F9FE] transition-all text-left"
                     >
                       <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold",
                           topic.part === 1 ? "bg-[#EEF0FD] text-[#4361EE]" : 
                           topic.part === 2 ? "bg-[#FFF7E6] text-[#B45309]" : "bg-[#F3F0FF] text-[#6D28D9]"
                         )}>
                           P{topic.part}
                         </div>
                         <div>
                           <div className="text-[13.5px] font-bold text-[#1A1D2B] group-hover:text-[#4361EE] transition-colors">{topic.name}</div>
                           <div className="text-[11px] text-[#9CA3AF] font-medium">{topic.questions.length} câu hỏi</div>
                         </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-[#E8ECF1] group-hover:text-[#4361EE] transition-all group-hover:translate-x-1" />
                     </button>
                   ))
                 )}
               </div>
            </div>

            {/* History */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-1">
                  <p className="section-title mb-0 flex items-center gap-2">
                    <History className="w-4 h-4 text-[#4361EE]" /> Lịch sử buổi học
                  </p>
               </div>
               
               <div className="space-y-3">
                 {loadingSessions ? (
                   [1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)
                 ) : sessions.length === 0 ? (
                   <div className="p-10 text-center bg-white border border-dashed border-[#E8ECF1] rounded-2xl">
                     <p className="text-[12.5px] text-[#9CA3AF]">Chưa có buổi học nào</p>
                   </div>
                 ) : (
                   sessions.slice(0, 5).map(s => (
                     <div 
                      key={s.id}
                      onClick={() => loadSession(s)}
                      className="group card p-4 flex items-center justify-between cursor-pointer hover:border-[#4361EE] transition-all"
                     >
                       <div className="space-y-1">
                          <div className="text-[13.5px] font-bold text-[#1A1D2B] group-hover:text-[#4361EE] transition-colors">{s.title}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] font-medium">
                            <Calendar className="w-3 h-3" /> {new Date(s.started_at).toLocaleDateString('vi-VN')}
                            <span className="mx-1">•</span>
                            <span className={cn(
                              "flex items-center gap-0.5",
                              s.answer_count === s.question_count ? "text-green-600" : "text-amber-600"
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
                       <div className="flex items-center gap-3">
                          {s.avg_band > 0 && (
                            <div className="bg-[#EEF0FD] px-2 py-1 rounded text-[11px] font-bold text-[#4361EE]">
                              {s.avg_band.toFixed(1)}
                            </div>
                          )}
                          <button 
                            onClick={(e) => deleteSession(e, s.id)}
                            className="p-2 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-[#E8ECF1] group-hover:text-[#4361EE]" />
                       </div>
                     </div>
                   ))
                 )}
                 {sessions.length > 5 && (
                   <button className="w-full py-2 text-[12px] font-bold text-[#4361EE] hover:underline">
                     Xem tất cả ({sessions.length})
                   </button>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'practice' && questions.length > 0) {
    const progress = ((activeIndex + 1) / questions.length) * 100;
    const q = questions[activeIndex];

    return (
      <div className="fixed inset-0 bg-[#F5F7FA] z-[1000] flex animate-in fade-in duration-300">
        {/* Practice Sidebar */}
        <aside className="w-[300px] bg-white border-r border-[#E8ECF1] flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-[#E8ECF1] space-y-6">
            <button 
              onClick={() => {
                if (confirm('Thoát buổi học?')) setView('input');
              }}
              className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider hover:text-[#1A1D2B] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Thoát
            </button>

            <div className="space-y-2.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-[#4361EE] uppercase tracking-widest">Tiến độ</span>
                <span className="text-[11px] font-bold text-[#1A1D2B]">{activeIndex + 1}/{questions.length}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="p-4 bg-[#F8F9FB] rounded-xl border border-[#E8ECF1] space-y-1">
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Avg. Band</div>
              <div className="text-2xl font-bold text-[#4361EE]">
                {(questions.filter(q => q.status === 'answered').reduce((acc, q) => acc + (q.overall_band || 0), 0) / 
                  (questions.filter(q => q.status === 'answered').length || 1)).toFixed(1)}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
             <p className="sidebar-section-label">Câu hỏi</p>
             {questions.map((item, idx) => (
               <button 
                 key={item.id}
                 onClick={() => setActiveIndex(idx)}
                 className={cn(
                   "sidebar-item",
                   idx === activeIndex && "active"
                 )}
               >
                 <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
                    idx === activeIndex ? "bg-[#4361EE] text-white" : "bg-[#F0F2F5] text-[#9CA3AF]"
                 )}>
                   {idx + 1}
                 </div>
                 <span className="truncate">{item.question_text}</span>
                 {item.status === 'answered' && (
                   <CheckCircle2 className="ml-auto w-3.5 h-3.5 text-[#1A8F5C]" />
                 )}
               </button>
             ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-12 flex items-center justify-center">
           <div className="w-full max-w-3xl space-y-8 animate-scale-in">
              <div className="card p-12 text-center space-y-10 shadow-xl border-none">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "badge",
                        q.part === 1 ? "badge--primary" : q.part === 2 ? "badge--warning" : "badge--purple"
                      )}>
                        IELTS Part {q.part}
                      </span>
                      <span className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-wider">{sessionTitle}</span>
                    </div>
                    <button 
                     onClick={() => speakText(q.question_text)}
                     className="w-10 h-10 rounded-xl bg-[#F0F2F5] flex items-center justify-center text-[#6B7280] hover:bg-[#EEF0FD] hover:text-[#4361EE] transition-all"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-[28px] md:text-[34px] font-bold text-[#1A1D2B] leading-tight font-heading">
                      "{q.question_text}"
                    </h2>
                    {q.part === 2 && (
                       <div className="bg-[#FFF7E6] p-4 rounded-xl border border-[#FED7AA] text-left max-w-md mx-auto">
                          <p className="text-[11px] font-bold text-[#B45309] uppercase mb-2">Cue Card Bullets:</p>
                          <ul className="text-[13px] text-[#92400E] list-disc pl-5 space-y-1">
                             <li>Describe this topic in detail</li>
                             <li>Explain why it is important</li>
                             <li>Give your personal opinion</li>
                          </ul>
                       </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-8">
                    {q.status === 'pending' ? (
                      <>
                        <div className="flex items-center gap-8">
                           <button 
                            disabled={activeIndex === 0}
                            onClick={() => setActiveIndex(prev => prev - 1)}
                            className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-all"
                           >
                             <ChevronLeft className="w-6 h-6 text-gray-400" />
                           </button>

                           <button 
                             onClick={() => {
                               setSelectedQuestion({ id: q.id, question_text: q.question_text });
                               setIsRecordingModalOpen(true);
                             }}
                             className="relative group"
                           >
                             <div className="absolute inset-0 bg-[#4361EE]/20 rounded-full blur-xl group-hover:bg-[#4361EE]/30 transition-all" />
                             <div className="relative w-20 h-20 bg-[#4361EE] rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-all">
                               <Mic className="w-8 h-8 text-white" />
                             </div>
                           </button>

                           <button 
                            disabled={activeIndex === questions.length - 1}
                            onClick={() => setActiveIndex(prev => prev + 1)}
                            className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-all"
                           >
                             <ChevronRight className="w-6 h-6 text-gray-400" />
                           </button>
                        </div>
                        <p className="text-[13.5px] text-[#6B7280]">Bấm micro hoặc nhấn phím Cách để trả lời</p>
                      </>
                    ) : (
                     <div className="w-full space-y-10 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                           <div className="bg-[#EEF0FD] p-6 rounded-2xl text-center">
                              <div className="text-3xl font-bold text-[#4361EE]">{q.overall_band?.toFixed(1)}</div>
                              <div className="text-[10px] font-bold text-[#4361EE] uppercase tracking-widest mt-1">Overall</div>
                           </div>
                           <div className="bg-[#F8F9FB] p-6 rounded-2xl border border-[#E8ECF1] text-center">
                              <div className="text-xl font-bold text-[#1A1D2B]">{q.feedback?.band_scores?.FC || '-'}</div>
                              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-1">Fluency</div>
                           </div>
                           <div className="bg-[#F8F9FB] p-6 rounded-2xl border border-[#E8ECF1] text-center">
                              <div className="text-xl font-bold text-[#1A1D2B]">{q.feedback?.band_scores?.LR || '-'}</div>
                              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-1">Lexical</div>
                           </div>
                           <div className="bg-[#F8F9FB] p-6 rounded-2xl border border-[#E8ECF1] text-center">
                              <div className="text-xl font-bold text-[#1A1D2B]">{q.feedback?.band_scores?.PRON || '-'}</div>
                              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-1">Pronun.</div>
                           </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                           <button 
                             onClick={() => setQuestions(prev => prev.map((item, idx) => idx === activeIndex ? {...item, status: 'pending'} : item))}
                             className="btn btn-ghost px-10 py-3.5"
                           >
                             Luyện lại
                           </button>
                           <button 
                             onClick={() => {
                               if (activeIndex < questions.length - 1) setActiveIndex(prev => prev + 1);
                               else setView('finish');
                             }}
                             className="btn btn-primary px-12 py-3.5"
                           >
                             {activeIndex < questions.length - 1 ? 'Tiếp theo' : 'Hoàn thành'}
                           </button>
                        </div>
                     </div>
                   )}
               </div>
            </div>

            {/* Speaking Tip */}
            <div className="bg-white card p-6 border-none shadow-lg flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-[#EEF0FD] flex items-center justify-center flex-shrink-0">
                 <Sparkles className="w-5 h-5 text-[#4361EE]" />
               </div>
               <div>
                 <p className="text-[11px] font-bold text-[#4361EE] uppercase tracking-widest mb-1">AI Speaking Tip</p>
                 <p className="text-[14px] text-[#4B5563] leading-relaxed">
                   {TIPS[q.part]}
                 </p>
               </div>
            </div>
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

    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-10 animate-scale-in">
        <div className="w-24 h-24 bg-[#E6F9F0] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12 text-[#1A8F5C]" />
        </div>

        <div className="space-y-3">
          <h1 className="text-[32px] font-bold text-[#1A1D2B] font-heading">Tuyệt vời! Buổi học đã hoàn thành</h1>
          <p className="text-[15px] text-[#6B7280]">Bạn đã hoàn thành {questions.length} câu hỏi. Dưới đây là Band score ước tính trung bình:</p>
        </div>

        <div className="bg-white card p-10 inline-block border-none shadow-xl">
           <div className="text-[64px] font-bold text-[#4361EE] leading-none">{avgBand}</div>
           <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-4">Estimated Band Score</div>
        </div>

        <div className="flex flex-col gap-3 max-w-sm mx-auto pt-6">
          <button onClick={() => setView('input')} className="btn btn-primary py-4">
            Về trang danh sách luyện tập
          </button>
          <button onClick={() => { setQuestionInput(''); setView('input'); }} className="btn btn-ghost py-4">
            Bắt đầu buổi học mới
          </button>
        </div>
      </div>
    );
  }

  return null;
}
