import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronRight, 
  Volume2, 
  AlertCircle,
  CheckCircle2,
  ListRestart
} from 'lucide-react';
import { Button } from '../shared/Button';
import { CueCard } from './CueCard';
import { AudioRecorder } from '../audio/AudioRecorder';
import { WaveformVisualizer } from '../audio/WaveformVisualizer';
import { LiveTranscript } from '../audio/LiveTranscript';
import { TestConfig } from './TestSetupModal';
import { cn } from '../../lib/utils';
import { useDeepgram } from '../../hooks/useDeepgram';
import api from '../../lib/api';

type TestState = 
  | 'IDLE' 
  | 'EXAMINER_SPEAKING' 
  | 'USER_SPEAKING' 
  | 'PART2_PREP' 
  | 'BETWEEN_QUESTIONS' 
  | 'COMPLETED';

interface Question {
  id: string;
  text: string;
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
  const { 
    interimTranscript, 
    finalTranscript, 
    startTranscribing, 
    stopTranscribing 
  } = useDeepgram();
  
  const currentQuestion = questions[currentQuestionIndex];
  const timerRef = useRef<any>(null);

  // Simulation: Examiner Voice (TTS)
  const speakQuestion = useCallback((text: string) => {
    setTestState('EXAMINER_SPEAKING');
    
    // In a real app, this would be a high-quality cloud TTS
    // For now, use browser speech synthesis
    const utterance = new SpeechSynthesisUtterance(text);
    // Rough heuristic for voice selection based on config
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
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }, [config.examinerVoice, currentQuestion]);

  const startPrepTimer = () => {
    setPrepTimer(60);
    timerRef.current = setInterval(() => {
      setPrepTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTestState('USER_SPEAKING');
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
    } else {
      setTestState('COMPLETED');
      // Finalize the session on backend
      api.post(`/test/${sessionId}/complete`).then(() => {
        onComplete();
      });
    }
  };

  const handleRecordingComplete = async (blob: Blob) => {
    stopTranscribing();
    setTestState('BETWEEN_QUESTIONS');
    
    // Submit answer to backend
    const formData = new FormData();
    formData.append('audio_file', blob, 'answer.wav');
    formData.append('question_id', currentQuestion.id);
    formData.append('question_text', currentQuestion.text);
    
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
      // Small delay before starting
      const timer = setTimeout(() => {
        speakQuestion(currentQuestion.text);
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {questions.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                idx < currentQuestionIndex ? "w-8 bg-success" : 
                idx === currentQuestionIndex ? "w-12 bg-primary animate-pulse" : 
                "w-4 bg-white/10"
              )}
            />
          ))}
        </div>
        <div className="text-text-muted text-xs font-bold uppercase tracking-widest leading-none">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="min-h-[400px] flex flex-col items-center justify-center relative">
        {(testState === 'IDLE' || testState === 'EXAMINER_SPEAKING') && (
          <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto relative">
              <Volume2 className="w-10 h-10 text-primary animate-pulse" />
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white max-w-xl mx-auto leading-relaxed italic">
                "{currentQuestion.text}"
              </h2>
              <p className="text-primary font-medium tracking-wide animate-pulse">
                Giám khảo đang đọc câu hỏi...
              </p>
            </div>
          </div>
        )}

        {testState === 'PART2_PREP' && currentQuestion.cueCard && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CueCard 
              topic={currentQuestion.cueCard.topic} 
              bullets={currentQuestion.cueCard.bullets}
              preparationTime={prepTimer}
            />
            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-text-secondary font-medium">Bạn có 1 phút để chuẩn bị. Bài thi sẽ tự động bắt đầu sau:</p>
              <div className="text-5xl font-black font-heading text-secondary tabular-nums">
                {prepTimer}s
              </div>
              <Button 
                variant="glass" 
                onClick={() => {
                  clearInterval(timerRef.current);
                  setTestState('USER_SPEAKING');
                }}
              >
                Tôi đã sẵn sàng
              </Button>
            </div>
          </div>
        )}

        {testState === 'USER_SPEAKING' && (
          <div className="w-full space-y-12 animate-in fade-in zoom-in duration-500">
            {currentQuestion.part === 2 && currentQuestion.cueCard && (
              <div className="opacity-60 scale-90 blur-[1px] grayscale-[50%] transition-all hover:opacity-100 hover:scale-95 hover:blur-0 hover:grayscale-0">
                <CueCard 
                  topic={currentQuestion.cueCard.topic} 
                  bullets={currentQuestion.cueCard.bullets}
                />
              </div>
            )}
            
            <div className="flex flex-col items-center gap-8">
              <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <WaveformVisualizer stream={stream} isRecording={true} className="h-24 w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/50 to-transparent pointer-events-none" />
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl group-hover:bg-red-500/30 transition-all duration-500" />
                <AudioRecorder 
                  onRecordingComplete={handleRecordingComplete}
                  onStreamUpdate={(s) => {
                    setStream(s);
                    startTranscribing(s);
                  }}
                  className="relative z-10"
                />
              </div>

              <div className="w-full max-w-2xl bg-white/[0.02] rounded-2xl p-6 border border-white/5">
                <LiveTranscript 
                  interimText={interimTranscript} 
                  finalText={finalTranscript} 
                  className="text-center" 
                />
              </div>
            </div>
          </div>
        )}

        {testState === 'BETWEEN_QUESTIONS' && (
          <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-success/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-success">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Xong câu hỏi {currentQuestionIndex + 1}!</h2>
              <p className="text-text-secondary max-w-sm mx-auto">
                Hệ thống đã ghi nhận câu trả lời của bạn. Sẵn sàng cho câu hỏi tiếp theo chưa?
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="glass" className="gap-2" onClick={() => setTestState('IDLE')}>
                <ListRestart className="w-4 h-4" />
                Làm lại câu này
              </Button>
              <Button className="gap-2 px-8" onClick={nextQuestion}>
                Câu tiếp theo
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {testState === 'COMPLETED' && (
          <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500">
             <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black font-heading text-white">Bài thi hoàn tất!</h2>
            <p className="text-lg text-text-secondary max-w-md mx-auto">
              Chúc mừng bạn đã hoàn thành bài thi thử. AI đang phân tích toàn bộ các câu trả lời của bạn.
            </p>
            <div className="pt-8 flex flex-col items-center gap-4">
               <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-primary to-secondary animate-shimmer" style={{ width: '100%' }} />
               </div>
               <p className="text-xs text-text-muted font-bold uppercase tracking-widest">
                 Đang trích xuất báo cáo chuyên sâu...
               </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-12 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
           <AlertCircle className="w-4 h-4" />
           Cảnh báo: Đừng thoát trang khi đang thi
        </div>
        <Button variant="ghost" size="sm" className="text-error hover:bg-error/10">
          Hủy bài thi
        </Button>
      </div>
    </div>
  );
}
