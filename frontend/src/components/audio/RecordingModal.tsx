import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AudioRecorder } from './AudioRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';
import { LiveTranscript } from './LiveTranscript';
import { Check, X, Mic2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranscription } from '@/hooks/useTranscription';
import { resampleAndConvertToWav } from '@/lib/audio';
import { FeedbackPanel } from '../feedback/FeedbackPanel';
import { AssessmentLoading } from '../feedback/AssessmentLoading';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: { id: string; question_text: string } | null;
  onSuccess: (result: any) => void;
}

export function RecordingModal({ isOpen, onClose, question, onSuccess }: RecordingModalProps) {
  const { user } = useAuth();
  const [stream, setStream]                     = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording]           = useState(false);
  const [audioBlob, setAudioBlob]               = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing]         = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);

  const { 
    interimTranscript, 
    finalTranscript, 
    status: transcriptionStatus,
    isFallback,
    startTranscribing, 
    stopTranscribing,
    resetTranscript 
  } = useTranscription();

  useEffect(() => {
    if (!isOpen) {
      setStream(null);
      setIsRecording(false);
      setAudioBlob(null);
      setIsProcessing(false);
      setAssessmentResult(null);
      stopTranscribing();
      resetTranscript();
    }
  }, [isOpen, stopTranscribing, resetTranscript]);

  const handleRecordingComplete = async (blob: Blob) => {
    setIsRecording(false);
    stopTranscribing();
    setIsProcessing(true);
    try {
      const wavBlob = await resampleAndConvertToWav(blob, 16000);
      setAudioBlob(wavBlob);
    } catch {
      setAudioBlob(blob);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStreamUpdate = (newStream: MediaStream) => {
    setStream(newStream);
    setIsRecording(true);
    resetTranscript();
    startTranscribing(newStream);
  };

  const handleAssess = async () => {
    if (!audioBlob || !question || !user) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');
    formData.append('question_id', question.id);
    formData.append('question_text', question.question_text);
    formData.append('user_id', user.id);

    try {
      const response = await api.post('/speech/assess', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAssessmentResult(response.data);
      onSuccess(response.data);
      toast.success('Đánh giá hoàn tất!', { description: 'AI đã phân tích xong bài nói.' });
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Đã có lỗi, vui lòng thử lại.';
      toast.error('Lỗi đánh giá', { description: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'p-0 overflow-y-auto border-0 transition-all duration-300',
          assessmentResult ? 'max-w-7xl h-[95vh]' : 'max-w-2xl'
        )}
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid var(--border-light)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        }}
      >
        {/* Top accent */}
        <div
          className="h-1 w-full rounded-t-2xl"
          style={{ background: 'var(--primary)' }}
        />

        {/* Close */}
        {assessmentResult && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-lg z-50 transition-colors hover:bg-gray-100"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className={cn('p-7 md:p-10', assessmentResult ? '' : 'space-y-6')}>
          {/* Loading */}
          {isProcessing && !assessmentResult ? (
            <AssessmentLoading />

          /* Result */
          ) : assessmentResult ? (
            <FeedbackPanel result={assessmentResult} />

          /* Recording */
          ) : (
            <>
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                  <Mic2 className="w-4 h-4" />
                  <span className="text-[11px] font-semibold tracking-wide uppercase">Câu hỏi luyện tập</span>
                </div>
                <DialogTitle
                  className="text-xl md:text-2xl font-bold font-heading leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {question.question_text}
                </DialogTitle>
              </DialogHeader>

              {/* Recording area */}
              <div
                className={cn(
                  'recording-container',
                  isRecording ? 'recording-container--active' : ''
                )}
              >
                <div className="p-6 flex flex-col items-center gap-4">
                  <WaveformVisualizer
                    stream={stream}
                    isRecording={isRecording}
                    className="w-full"
                  />
                  <div className="relative">
                    {isRecording && <div className="recording-ring" />}
                    <AudioRecorder
                      onRecordingComplete={handleRecordingComplete}
                      onStreamUpdate={handleStreamUpdate}
                    />
                  </div>
                </div>
              </div>

              {/* Live transcript */}
              <div className="space-y-2">
                <LiveTranscript
                  interimText={interimTranscript}
                  finalText={finalTranscript}
                  status={transcriptionStatus}
                  isFallback={isFallback}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!assessmentResult && !isProcessing && (
          <DialogFooter
            className="px-7 md:px-10 py-5 gap-3 flex-row"
            style={{
              background: 'var(--bg-body)',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <Button
              variant="ghost"
              onClick={onClose}
              className="btn-ghost rounded-xl px-6 font-semibold text-sm border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-light)' }}
            >
              Hủy bỏ
            </Button>

            <Button
              onClick={handleAssess}
              disabled={!audioBlob || isProcessing}
              className="btn-primary rounded-xl px-8 font-semibold text-sm flex-1 md:flex-none min-w-[160px]"
              style={{
                opacity: !audioBlob ? 0.45 : 1,
                cursor: !audioBlob ? 'not-allowed' : 'pointer',
              }}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                  />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Nộp bài đánh giá
                </span>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
