import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AudioRecorder } from './AudioRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';
import { LiveTranscript } from './LiveTranscript';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeepgram } from '@/hooks/useDeepgram';
import { resampleAndConvertToWav } from '@/lib/audio';
import { FeedbackPanel } from '../feedback/FeedbackPanel';
import { AssessmentLoading } from '../feedback/AssessmentLoading';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    id: string;
    text: string;
  } | null;
  onSuccess: (result: any) => void;
}

export function RecordingModal({ isOpen, onClose, question, onSuccess }: RecordingModalProps) {
  const { user } = useAuth();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);

  const { 
    interimTranscript, 
    finalTranscript, 
    startTranscribing, 
    stopTranscribing 
  } = useDeepgram();

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setStream(null);
      setIsRecording(false);
      setAudioBlob(null);
      setIsProcessing(false);
      setAssessmentResult(null);
      stopTranscribing();
    }
  }, [isOpen, stopTranscribing]);

  const handleRecordingComplete = async (blob: Blob) => {
    setIsRecording(false);
    stopTranscribing();
    
    setIsProcessing(true);
    try {
      // resample to 16kHz WAV for Azure
      const wavBlob = await resampleAndConvertToWav(blob, 16000);
      setAudioBlob(wavBlob);
    } catch (err) {
      console.error("Resampling failed:", err);
      setAudioBlob(blob);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStreamUpdate = (newStream: MediaStream) => {
    setStream(newStream);
    setIsRecording(true);
    startTranscribing(newStream);
  };

  const handleAssess = async () => {
    if (!audioBlob || !question || !user) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');
    formData.append('question_id', question.id);
    formData.append('question_text', question.text);
    formData.append('user_id', user.id);

    try {
      const response = await api.post('/speech/assess', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAssessmentResult(response.data);
      onSuccess(response.data);
      toast.success('Đánh giá hoàn tất!', {
        description: 'AI đã phân tích xong bài nói của bạn.'
      });
    } catch (error: any) {
      console.error("Failed to process speech:", error);
      const errorMessage = error.response?.data?.detail || "Đã có lỗi xảy ra trong quá trình đánh giá. Vui lòng thử lại.";
      toast.error('Lỗi đánh giá', {
        description: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "bg-background-primary/95 backdrop-blur-2xl border-white/5 shadow-2xl p-0 overflow-y-auto rounded-[2.5rem] ring-1 ring-white/10 transition-all duration-700",
        assessmentResult ? "max-w-7xl h-[95vh] h-[95svh]" : "max-w-4xl"
      )}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-primary/40 opacity-50" />
        
        {assessmentResult && (
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-50"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className={cn("p-10 md:p-14", assessmentResult ? "" : "space-y-10")}>
          {isProcessing && !assessmentResult ? (
            <AssessmentLoading />
          ) : !assessmentResult ? (
            <>
              <DialogHeader className="space-y-4">
                <div className="flex items-center gap-3 text-primary/60 font-black tracking-widest text-[11px] uppercase">
                  <span className="w-8 h-[1px] bg-primary/40" />
                  Câu hỏi luyện tập
                </div>
                <DialogTitle className="text-3xl md:text-4xl font-black text-white leading-tight font-heading drop-shadow-sm">
                  {question.text}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-12">
                <div className="relative rounded-3xl bg-white/[0.03] border border-white/5 overflow-hidden group">
                  {isRecording && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-red-500/5 animate-pulse" />
                  )}
                  
                  <div className="relative p-8 flex flex-col items-center">
                    <WaveformVisualizer 
                      stream={stream} 
                      isRecording={isRecording} 
                      className="mb-8"
                    />
                    
                    <AudioRecorder 
                      onRecordingComplete={handleRecordingComplete}
                      onStreamUpdate={handleStreamUpdate}
                      className="mb-4"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Bản ghi trực tiếp</h4>
                    <div className={cn(
                      "flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest transition-all",
                      isRecording ? "text-red-400" : "text-white/20"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isRecording ? "bg-red-400 animate-pulse" : "bg-white/20"
                      )} />
                      {isRecording ? "Live" : "Idle"}
                    </div>
                  </div>
                  
                  <LiveTranscript 
                    interimText={interimTranscript}
                    finalText={finalTranscript}
                  />
                </div>
              </div>
            </>
          ) : (
            <FeedbackPanel result={assessmentResult} />
          )}
        </div>

        {!assessmentResult && !isProcessing && (
          <DialogFooter className="bg-white/[0.04] p-10 mt-0 border-t border-white/5 gap-4">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="rounded-2xl px-10 py-7 text-sm font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white/40 border-none m-0"
            >
              Hủy bỏ
            </Button>
            
            <Button 
              onClick={handleAssess}
              disabled={!audioBlob || isProcessing}
              className="rounded-2xl px-10 py-7 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover-lift m-0 min-w-[200px]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Check className="w-5 h-5 stroke-[3px]" />
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
