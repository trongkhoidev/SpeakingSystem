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
import { ProfessionalModals } from '../shared/ProfessionalModals';

type TestState = 
  | 'IDLE' 
  | 'EXAMINER_SPEAKING' 
  | 'USER_SPEAKING' 
  | 'PART2_PREP' 
  | 'NEXT_TRANSITION'
  | 'ANALYZING'
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
  const [pendingAssessments, setPendingAssessments] = useState(0);


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
      // Last question completed
      setTestState('ANALYZING');
    }
  };

  // Wait for all background assessments to finish before completing
  useEffect(() => {
    if (testState === 'ANALYZING' && pendingAssessments === 0) {
      const finalizeTest = async () => {
        try {
          await api.post(`/test/${sessionId}/complete`);
          onComplete();
        } catch (error) {
          console.error("Failed to complete test:", error);
          // Still move to complete to show report
          onComplete();
        }
      };
      finalizeTest();
    }
  }, [testState, pendingAssessments, sessionId, onComplete]);

  const handleRecordingComplete = async (blob: Blob) => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopTranscribing();
    
    // Background Task: Submit answer for AI assessment
    const formData = new FormData();
    formData.append('audio_file', blob, 'answer.wav');
    formData.append('question_id', currentQuestion.id);
    formData.append('question_text', currentQuestion.question_text);
    
    setPendingAssessments(prev => prev + 1);
    
    // Fire and forget (let it run in background)
    api.post(`/test/${sessionId}/answer`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).finally(() => {
      setPendingAssessments(prev => prev - 1);
    });

    // Zero-Interruption: Move to next state IMMEDIATELY
    setTestState('NEXT_TRANSITION');
    
    // Small delay for UI smoothness before next examiner prompt
    setTimeout(() => {
      nextQuestion();
    }, 1500);
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

        {testState === 'NEXT_TRANSITION' && (
          <div className="space-y-10 text-center animate-scale-in">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#1A1D2B] font-heading tracking-tight">Câu trả lời đã được ghi nhận</h2>
              <p className="text-[14px] text-[#6B7280] max-w-sm mx-auto font-medium">
                Đang chuyển sang thử thách tiếp theo...
              </p>
            </div>
          </div>
        )}

        {testState === 'ANALYZING' && (
          <div className="space-y-10 text-center animate-scale-in">
             <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl relative">
              <Sparkles className="w-12 h-12 text-blue-600 animate-spin-slow" />
              <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-[2.5rem] animate-spin" />
            </div>
            <div className="space-y-4">
              <h2 className="text-[32px] font-black text-[#1A1D2B] font-heading tracking-tight">Đang phân tích bài thi...</h2>
              <p className="text-[16px] text-[#6B7280] max-w-md mx-auto font-medium leading-relaxed">
                Hệ thống AI đang tổng hợp và đánh giá chuyên sâu toàn bộ các câu trả lời của bạn. Vui lòng đợi trong giây lát.
              </p>
            </div>
            <div className="pt-8 flex flex-col items-center gap-6">
               <div className="w-full max-w-xs h-2 bg-[#E8ECF1] rounded-full overflow-hidden">
                 <motion.div 
                    className="h-full bg-blue-600"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 10, repeat: Infinity }}
                 />
               </div>
               <div className="flex items-center gap-3">
                 <div className="flex gap-1">
                   {[1, 2, 3].map(i => (
                     <motion.div 
                        key={i}
                        className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                     />
                   ))}
                 </div>
                 <p className="text-[11px] text-[#9CA3AF] font-black uppercase tracking-[0.2em]">
                   Pending Analysis: {pendingAssessments} tasks
                 </p>
               </div>
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

      <ProfessionalModals />
    </div>
  );
}
