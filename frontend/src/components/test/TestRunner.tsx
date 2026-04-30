import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2, AlertCircle, CheckCircle2, Clock, Sparkles,
  Mic, Square, Keyboard
} from 'lucide-react';
import { CueCard } from './CueCard';
import { WaveformVisualizer } from '../audio/WaveformVisualizer';
import { LiveTranscript } from '../audio/LiveTranscript';
import { TestConfig } from './TestSetupModal';
import { cn } from '../../lib/utils';
import { useTranscription } from '../../hooks/useTranscription';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import { ProfessionalModals } from '../shared/ProfessionalModals';

/*
 * EXAM FLOW:
 *  READING_QUESTION  → TTS reads the question (auto-advance after 8s fallback)
 *  READY_TO_ANSWER   → Show big Mic button — user presses Mic or Space
 *  PART2_PREP        → 60s cue card preparation (Part 2 only)
 *  USER_SPEAKING     → Recording with countdown timer
 *  NEXT_TRANSITION   → Brief "saved" feedback
 *  ANALYZING         → Wait for all AI assessments to finish
 */

type TestState =
  | 'READING_QUESTION'
  | 'READY_TO_ANSWER'
  | 'PART2_PREP'
  | 'USER_SPEAKING'
  | 'NEXT_TRANSITION'
  | 'ANALYZING';

interface Question {
  id: string;
  question_text: string;
  part: 1 | 2 | 3;
  cue_card_json?: string;
  cueCard?: { topic: string; bullets: string[] };
}

interface TestRunnerProps {
  sessionId: string;
  config: TestConfig;
  questions: Question[];
  onComplete: () => void;
}

function parseCueCard(q: Question) {
  if (q.cueCard) return q.cueCard;
  if (q.cue_card_json) {
    try {
      const p = JSON.parse(q.cue_card_json);
      return { topic: p.topic || q.question_text, bullets: p.bullets || [] };
    } catch { return null; }
  }
  return null;
}

export function TestRunner({ sessionId, config, questions, onComplete }: TestRunnerProps) {
  const [idx, setIdx] = useState(0);
  const [testState, setTestState] = useState<TestState>('READING_QUESTION');
  const [countdown, setCountdown] = useState(0);
  const [isLowTime, setIsLowTime] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pendingAssessments, setPendingAssessments] = useState(0);

  const countdownRef = useRef<any>(null);
  const ttsTimeoutRef = useRef<any>(null);

  const currentQuestion = questions[idx];
  const cueCard = currentQuestion ? parseCueCard(currentQuestion) : null;

  const { interimTranscript, finalTranscript, startTranscribing, stopTranscribing, resetTranscript } = useTranscription();

  // ── Recording hook — directly controlled ──
  const handleRecordingDone = useCallback((blob: Blob) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopTranscribing();

    const q = questions[idx]; // capture current
    const formData = new FormData();
    formData.append('audio_file', blob, 'answer.webm');
    formData.append('question_id', q.id);
    formData.append('question_text', q.question_text);
    formData.append('part_number', String(q.part));

    setPendingAssessments(prev => prev + 1);
    api.post(`/test/${sessionId}/answer`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).finally(() => setPendingAssessments(prev => prev - 1));

    // Transition
    setTestState('NEXT_TRANSITION');
    setTimeout(() => {
      if (idx < questions.length - 1) {
        setIdx(prev => prev + 1);
        setTestState('READING_QUESTION');
        resetTranscript();
      } else {
        setTestState('ANALYZING');
      }
    }, 1500);
  }, [idx, questions, sessionId, stopTranscribing, resetTranscript]);

  const {
    isRecording, duration, isError, volume,
    startRecording, stopRecording, formatDuration
  } = useMediaRecorder({
    onRecordingComplete: handleRecordingDone,
    onStreamUpdate: (s) => { setStream(s); startTranscribing(s); }
  });

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // ── Sync URL ──
  useEffect(() => {
    if (sessionId && !window.location.pathname.includes(sessionId)) {
      window.history.replaceState(null, '', `/test/${sessionId}`);
    }
  }, [sessionId]);

  // ── TTS with fallback ──
  useEffect(() => {
    if (testState !== 'READING_QUESTION' || !currentQuestion) return;

    const advanceAfterReading = () => {
      if (currentQuestion.part === 2 && cueCard) {
        setTestState('PART2_PREP');
        startTimer(60);
      } else {
        setTestState('READY_TO_ANSWER');
      }
    };

    // Fallback: advance after 8s regardless
    ttsTimeoutRef.current = setTimeout(advanceAfterReading, 8000);

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(currentQuestion.question_text);
      utter.rate = 0.9;
      utter.lang = 'en-GB';

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('samantha'))
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utter.voice = preferred;

      utter.onend = () => { clearTimeout(ttsTimeoutRef.current); advanceAfterReading(); };
      utter.onerror = () => { clearTimeout(ttsTimeoutRef.current); advanceAfterReading(); };

      window.speechSynthesis.speak(utter);
    } catch {
      clearTimeout(ttsTimeoutRef.current);
      advanceAfterReading();
    }

    return () => { clearTimeout(ttsTimeoutRef.current); };
  }, [testState, idx]); // eslint-disable-line

  // ── Timer util ──
  const startTimer = (seconds: number) => {
    setCountdown(seconds);
    setIsLowTime(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 6) setIsLowTime(true);
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          // Auto-stop recording
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Start speaking ──
  const handleStartSpeaking = async () => {
    setTestState('USER_SPEAKING');
    const dur = currentQuestion.part === 1 ? 45 : currentQuestion.part === 2 ? 120 : 60;
    startTimer(dur);
    // Auto-start recording
    try {
      await startRecording();
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  };

  // ── Finalize ──
  useEffect(() => {
    if (testState === 'ANALYZING' && pendingAssessments === 0) {
      const fin = async () => {
        try { await api.post(`/test/${sessionId}/complete`); } catch {}
        onComplete();
      };
      fin();
    }
  }, [testState, pendingAssessments, sessionId, onComplete]);

  // ── Keyboard: Space ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      e.preventDefault();

      if (testState === 'READY_TO_ANSWER') handleStartSpeaking();
      else if (testState === 'USER_SPEAKING' && isRecording) stopRecording();
      else if (testState === 'PART2_PREP') {
        if (countdownRef.current) clearInterval(countdownRef.current);
        handleStartSpeaking();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [testState, isRecording]); // eslint-disable-line

  if (!currentQuestion) return null;
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pulseScale = 1 + (volume / 255) * 1.2;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }} className="animate-in fade-in duration-500">
      {/* ── Progress ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              height: 6, borderRadius: 3, transition: 'all 0.5s',
              flex: i === idx ? 2 : 1,
              background: i < idx ? '#1A8F5C' : i === idx ? '#4361EE' : '#E8ECF1'
            }} />
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          Part {currentQuestion.part} • Câu {idx + 1}/{questions.length}
        </span>
      </div>

      {/* ── Main ── */}
      <div style={{ minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {/* READING QUESTION */}
        {testState === 'READING_QUESTION' && (
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#EEF0FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              position: 'relative'
            }}>
              <Volume2 style={{ width: 36, height: 36, color: '#4361EE' }} />
              <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(67,97,238,0.15)', animation: 'ping 1.5s infinite' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1A1D2B', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>
              "{currentQuestion.question_text}"
            </h2>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#4361EE', textTransform: 'uppercase', letterSpacing: '0.15em', animation: 'pulse 2s infinite' }}>
              🔊 Giám khảo đang đọc câu hỏi...
            </p>
          </div>
        )}

        {/* READY TO ANSWER */}
        {testState === 'READY_TO_ANSWER' && (
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1D2B', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
              "{currentQuestion.question_text}"
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 36, fontWeight: 600 }}>
              Nhấn nút Mic bên dưới hoặc phím <strong>Space</strong> để bắt đầu trả lời
            </p>
            <button
              onClick={handleStartSpeaking}
              style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4361EE, #3B82F6)', border: 'none',
                cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 40px rgba(67,97,238,0.4), 0 0 0 8px rgba(67,97,238,0.1)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              <Mic style={{ width: 40, height: 40 }} />
            </button>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 20, background: '#F1F5F9'
            }}>
              <Keyboard style={{ width: 14, height: 14, color: '#94A3B8' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Nhấn <kbd style={{ fontFamily: 'monospace', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>SPACE</kbd> để bắt đầu
              </span>
            </div>
          </div>
        )}

        {/* PART 2 PREP */}
        {testState === 'PART2_PREP' && cueCard && (
          <div style={{ width: '100%', maxWidth: 560 }}>
            <CueCard topic={cueCard.topic} bullets={cueCard.bullets} preparationTime={countdown} />
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Thời gian chuẩn bị</p>
              <div style={{ fontSize: 52, fontWeight: 900, color: countdown <= 10 ? '#DC2626' : '#4361EE', fontFamily: 'Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(countdown)}</div>
              <button onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); handleStartSpeaking(); }}
                style={{ marginTop: 20, padding: '14px 40px', borderRadius: 16, background: '#4361EE', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(67,97,238,0.3)' }}>
                Tôi sẵn sàng — Bắt đầu nói
              </button>
            </div>
          </div>
        )}

        {/* USER SPEAKING */}
        {testState === 'USER_SPEAKING' && (
          <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', fontStyle: 'italic', marginBottom: 20, opacity: 0.7 }}>
              "{currentQuestion.question_text}"
            </p>
            {currentQuestion.part === 2 && cueCard && (
              <div style={{ opacity: 0.3, transform: 'scale(0.9)', marginBottom: 16 }}><CueCard topic={cueCard.topic} bullets={cueCard.bullets} /></div>
            )}

            {/* Countdown */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 24px', borderRadius: 30,
              background: isLowTime ? '#FEF2F2' : '#F8FAFC', border: `2px solid ${isLowTime ? '#FECACA' : '#E2E8F0'}`, marginBottom: 20
            }}>
              <Clock style={{ width: 18, height: 18, color: isLowTime ? '#DC2626' : '#4361EE' }} />
              <span style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: isLowTime ? '#DC2626' : '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
                {fmtTime(countdown)}
              </span>
            </div>

            {/* Waveform */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: `1px solid ${isLowTime ? '#FECACA' : '#E2E8F0'}`, marginBottom: 24 }}>
              <WaveformVisualizer stream={stream} isRecording={isRecording} className="h-20 w-full" />
            </div>

            {/* Mic Button — Stop */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              {/* Pulse rings */}
              <div style={{
                position: 'absolute', inset: -12, borderRadius: '50%', background: 'rgba(239,68,68,0.08)',
                transform: `scale(${pulseScale})`, transition: 'transform 0.15s'
              }} />
              <button onClick={stopRecording} style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#EF4444', border: 'none', cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1,
                boxShadow: '0 6px 30px rgba(239,68,68,0.4)'
              }}>
                <Square style={{ width: 28, height: 28, fill: '#fff' }} />
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginBottom: 16 }}>
              {isRecording ? `🔴 Đang ghi âm — ${formatDuration(duration)}` : 'Đang khởi tạo mic...'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 16, background: '#F1F5F9', marginBottom: 16 }}>
              <Keyboard style={{ width: 12, height: 12, color: '#94A3B8' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                Nhấn <kbd style={{ fontFamily: 'monospace', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 3, padding: '0 4px', fontSize: 10 }}>SPACE</kbd> để dừng
              </span>
            </div>

            {/* Live Transcript */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #E2E8F0', minHeight: 50 }}>
              <LiveTranscript interimText={interimTranscript} finalText={finalTranscript} className="text-center text-[#1A1D2B]" />
            </div>
          </div>
        )}

        {/* NEXT TRANSITION */}
        {testState === 'NEXT_TRANSITION' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 style={{ width: 36, height: 36, color: '#1A8F5C' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>Câu trả lời đã được ghi nhận ✓</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Đang chuyển sang câu hỏi tiếp theo...</p>
          </div>
        )}

        {/* ANALYZING */}
        {testState === 'ANALYZING' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 24, background: '#EEF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' }}>
              <Sparkles style={{ width: 40, height: 40, color: '#4361EE' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, border: '3px solid transparent', borderTopColor: '#4361EE', animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>Đang phân tích bài thi...</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>AI đang đánh giá toàn bộ câu trả lời. Vui lòng chờ.</p>
            <div style={{ marginTop: 28 }}>
              <div style={{ width: 200, height: 6, background: '#E2E8F0', borderRadius: 3, margin: '0 auto', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', background: '#4361EE', borderRadius: 3 }} animate={{ width: ['0%', '100%'] }} transition={{ duration: 8, repeat: Infinity }} />
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {pendingAssessments > 0 ? `Đang xử lý ${pendingAssessments} câu...` : 'Đang hoàn tất...'}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 20px', color: '#DC2626', fontSize: 13, fontWeight: 600, marginTop: 16 }}>
            ⚠️ Không thể truy cập Microphone. Vui lòng kiểm tra quyền truy cập.
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid #E8ECF1', opacity: 0.6, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <AlertCircle style={{ width: 14, height: 14 }} />
          Không tải lại trang khi đang thi
        </div>
        <button onClick={() => { if (confirm('Bạn có chắc muốn hủy bài thi?')) window.location.href = '/test'; }}
          style={{ padding: '6px 16px', borderRadius: 10, fontSize: 12, border: '1px solid #FECACA', background: '#fff', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>
          Hủy bài thi
        </button>
      </div>

      <ProfessionalModals />
    </div>
  );
}
