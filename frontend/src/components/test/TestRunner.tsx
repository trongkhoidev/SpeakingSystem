import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronRight, 
  Volume2, 
  AlertCircle,
  CheckCircle2,
  ListRestart,
  ArrowRight,
  Clock,
  Zap,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Button } from '../ui/Button';
import { CueCard } from './CueCard';
import { AudioRecorder } from '../audio/AudioRecorder';
import { WaveformVisualizer } from '../audio/WaveformVisualizer';
import { LiveTranscript } from '../audio/LiveTranscript';
import { TestConfig } from './TestSetupModal';
import { cn } from '../../lib/utils';
import { useTranscription } from '../../hooks/useTranscription';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';

type TestState = 
  | 'IDLE' 
  | 'EXAMINER_SPEAKING' 
  | 'USER_SPEAKING' 
  | 'PART2_PREP' 
  | 'BETWEEN_QUESTIONS' 
  | 'COMPLETED';

interface Question {
  id: string;
  question_text: string;
  part: 1 | 2 | 3;
  cueCard?: {
    topic: string;
    bullets: string[];
  };
}

interface TestRunnerProps {
  sessionId: string;
  config: TestConfig;
  questions: Question[];
  onComplete: () => void;
}

export function TestRunner({ sessionId, config, questions, onComplete }: TestRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testState, setTestState] = useState<TestState>('IDLE');
  const [prepTimer, setPrepTimer] = useState(60);
  const [answers, setAnswers] = useState<any[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [speakingTimer, setSpeakingTimer] = useState(60);
  const [isLowTime, setIsLowTime] = useState(false);
  const recorderRef = useRef<any>(null);
  const { 
    interimTranscript, 
    finalTranscript, 
    startTranscribing, 
    stopTranscribing,
    resetTranscript
  } = useTranscription();
  
  const navigate = useNavigate();
  const currentQuestion = questions[currentQuestionIndex];
  const timerRef = useRef<any>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isTokenRequired, setIsTokenRequired] = useState(false);

  useEffect(() => {
    const handleTrialLimit = () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLimitReached(true);
    };
    const handleTokenRequired = () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTokenRequired(true);
    };

    window.addEventListener('trial-limit-reached', handleTrialLimit);
    window.addEventListener('insufficient-tokens', handleTokenRequired);

    return () => {
      window.removeEventListener('trial-limit-reached', handleTrialLimit);
      window.removeEventListener('insufficient-tokens', handleTokenRequired);
    };
  }, []);

  // Simulation: Examiner Voice (TTS)
  const speakQuestion = useCallback((text: string) => {
    setTestState('EXAMINER_SPEAKING');
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (config.examinerVoice.includes('female')) {
      const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google uk english female'));
      if (femaleVoice) utterance.voice = femaleVoice;
    }
    
    utterance.onend = () => {
      if (currentQuestion.part === 2) {
        setTestState('PART2_PREP');
        startPrepTimer();
      } else {
        setTestState('USER_SPEAKING');
        if (config.timeLimitEnabled) {
          const duration = currentQuestion.part === 1 ? 30 : currentQuestion.part === 2 ? 120 : 45;
          startSpeakingTimer(duration);
        } else {
          startSpeakingTimer(300); // Default to 5 mins if no limit
        }
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }, [config.examinerVoice, currentQuestion]);

  const startSpeakingTimer = (duration: number) => {
    setSpeakingTimer(duration);
    setIsLowTime(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setSpeakingTimer(prev => {
        if (prev <= 6) setIsLowTime(true);
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoStop = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording();
    }
  };

  const startPrepTimer = () => {
    setPrepTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPrepTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTestState('USER_SPEAKING');
          if (config.timeLimitEnabled) {
            startSpeakingTimer(120);
          } else {
            startSpeakingTimer(300);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTestState('IDLE');
      resetTranscript();
    } else {
      setTestState('COMPLETED');
      api.post(`/test/${sessionId}/complete`).then(() => {
        onComplete();
      });
    }
  };

  const handleRecordingComplete = async (blob: Blob) => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopTranscribing();
    setTestState('BETWEEN_QUESTIONS');
    
    // Auto-advance after 3 seconds in mock test
    setTimeout(() => {
      nextQuestion();
    }, 3000);
    
    const formData = new FormData();
    formData.append('audio_file', blob, 'answer.wav');
    formData.append('question_id', currentQuestion.id);
    formData.append('question_text', currentQuestion.question_text);
    
    try {
      await api.post(`/test/${sessionId}/answer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnswers([...answers, { questionId: currentQuestion.id, status: 'submitted' }]);
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  useEffect(() => {
    if (testState === 'IDLE' && currentQuestion) {
      const timer = setTimeout(() => {
        speakQuestion(currentQuestion.question_text);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [testState, currentQuestion, speakQuestion]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      {/* Progress Header */}
      <div className="flex items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-3 flex-1">
          {questions.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all duration-700",
                idx < currentQuestionIndex ? "w-8 bg-[#1A8F5C]" : 
                idx === currentQuestionIndex ? "w-12 bg-[#4361EE] animate-pulse" : 
                "flex-1 bg-[#E8ECF1]"
              )}
            />
          ))}
        </div>
        <div className="text-[#9CA3AF] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
          Câu {currentQuestionIndex + 1} / {questions.length}
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="min-h-[450px] flex flex-col items-center justify-center relative">
        {(testState === 'IDLE' || testState === 'EXAMINER_SPEAKING') && (
          <div className="space-y-10 text-center animate-scale-in">
            <div className="w-24 h-24 bg-[#EEF0FD] rounded-full flex items-center justify-center mx-auto relative">
              <Volume2 className="w-10 h-10 text-[#4361EE] animate-pulse" />
              <div className="absolute inset-0 border-2 border-[#4361EE]/20 rounded-full animate-ping" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A1D2B] max-w-xl mx-auto leading-relaxed italic font-heading">
                "{currentQuestion.question_text}"
              </h2>
              <p className="text-[#4361EE] text-[13px] font-bold tracking-wide uppercase animate-pulse">
                Giám khảo đang đọc câu hỏi...
              </p>
            </div>
          </div>
        )}

        {testState === 'PART2_PREP' && currentQuestion.cueCard && (
          <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CueCard 
              topic={currentQuestion.cueCard.topic} 
              bullets={currentQuestion.cueCard.bullets}
              preparationTime={prepTimer}
            />
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Thời gian chuẩn bị</span>
                <div className="text-6xl font-black font-heading text-[#4361EE] tabular-nums">
                  {prepTimer}s
                </div>
              </div>
              <button 
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setTestState('USER_SPEAKING');
                }}
                className="btn btn-primary px-10 py-4 shadow-xl"
              >
                Tôi đã sẵn sàng để nói
              </button>
            </div>
          </div>
        )}

        {testState === 'USER_SPEAKING' && (
          <div className="w-full space-y-12 animate-scale-in">
            {currentQuestion.part === 2 && currentQuestion.cueCard && (
              <div className="opacity-40 scale-90 blur-[0.5px] transition-all hover:opacity-100 hover:scale-95 hover:blur-0">
                <CueCard 
                  topic={currentQuestion.cueCard.topic} 
                  bullets={currentQuestion.cueCard.bullets}
                />
              </div>
            )}
            
            <div className="flex flex-col items-center gap-10">
              <div className={cn(
                "w-full max-w-md bg-white border rounded-2xl p-8 shadow-sm transition-all duration-300",
                isLowTime ? "border-red-500 shadow-lg shadow-red-100 animate-pulse" : "border-[#E8ECF1]"
              )}>
                <WaveformVisualizer stream={stream} isRecording={true} className="h-24 w-full" />
              </div>

              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-full blur-2xl transition-all duration-500",
                  isLowTime ? "bg-red-500/30 animate-pulse" : "bg-[#4361EE]/10"
                )} />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-white border border-[#E8ECF1] rounded-full shadow-sm">
                   <Clock className={cn("w-3.5 h-3.5", isLowTime ? "text-red-500 animate-bounce" : "text-[#4361EE]")} />
                   <span className={cn("text-[13px] font-bold tabular-nums", isLowTime ? "text-red-500" : "text-[#1A1D2B]")}>
                      {Math.floor(speakingTimer / 60)}:{(speakingTimer % 60).toString().padStart(2, '0')}
                   </span>
                </div>
                <AudioRecorder 
                  ref={recorderRef}
                  onRecordingComplete={handleRecordingComplete}
                  onStreamUpdate={(s) => {
                    setStream(s);
                    startTranscribing(s);
                  }}
                />
              </div>

              <div className="w-full max-w-2xl bg-white rounded-2xl p-8 border border-[#E8ECF1] shadow-sm">
                <LiveTranscript 
                  interimText={interimTranscript} 
                  finalText={finalTranscript} 
                  className="text-center text-[#1A1D2B]" 
                />
              </div>
            </div>
          </div>
        )}

        {testState === 'BETWEEN_QUESTIONS' && (
          <div className="space-y-10 text-center animate-scale-in">
            <div className="w-20 h-20 bg-[#E6F9F0] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#1A8F5C]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#1A1D2B] font-heading">Hoàn thành câu hỏi {currentQuestionIndex + 1}!</h2>
              <p className="text-[14px] text-[#6B7280] max-w-sm mx-auto">
                Câu trả lời đã được lưu. Hãy sẵn sàng cho thử thách tiếp theo.
              </p>
            </div>
            <div className="flex gap-4 justify-center opacity-50 pointer-events-none">
              <button className="btn btn-ghost px-8">
                <ListRestart className="w-4 h-4" />
                Luyện lại câu này
              </button>
              <button className="btn btn-primary px-10 gap-2">
                Đang chuyển câu...
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {testState === 'COMPLETED' && (
          <div className="space-y-10 text-center animate-scale-in">
             <div className="w-24 h-24 bg-[#EEF0FD] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <CheckCircle2 className="w-12 h-12 text-[#4361EE]" />
            </div>
            <h2 className="text-[32px] font-bold text-[#1A1D2B] font-heading">Bài thi hoàn tất!</h2>
            <p className="text-[15px] text-[#6B7280] max-w-md mx-auto">
              Chúc mừng bạn đã hoàn thành bài thi thử. AI đang tổng hợp và phân tích toàn bộ câu trả lời của bạn.
            </p>
            <div className="pt-8 flex flex-col items-center gap-6">
               <div className="w-full max-w-xs h-1.5 bg-[#E8ECF1] rounded-full overflow-hidden">
                 <div className="h-full bg-[#4361EE] animate-pulse" style={{ width: '100%' }} />
               </div>
               <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">
                 Đang khởi tạo báo cáo chuyên sâu...
               </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Warnings */}
      <div className="flex items-center justify-between pt-10 border-t border-[#E8ECF1] opacity-60">
        <div className="flex items-center gap-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
           <AlertCircle className="w-4 h-4" />
           Cảnh báo: Không tải lại trang khi đang thi
        </div>
        <button className="btn btn-ghost border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 text-xs px-4 py-2">
          Hủy bài thi
        </button>
      </div>

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
                  Bạn đã khám phá hết các tính năng dành cho khách. Hãy đăng nhập để tiếp tục luyện tập, lưu lịch sử bài nói và nhận thêm token miễn phí mỗi ngày nhé!
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
                <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Hết Token luyện tập!</h2>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                  Hệ thống cần token để thực hiện đánh giá AI chuyên sâu. Bạn có thể nâng cấp gói hội viên hoặc đợi nhận token miễn phí vào ngày mai.
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
    </div>
  );
}
