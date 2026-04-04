import React, { useState, useRef, useEffect } from 'react';
import { Activity, Mic, Square } from 'lucide-react';

/**
 * ZenMode Component
 * 
 * Minimalist interface for IELTS speaking practice:
 * - Center question display
 * - Waveform visualization during recording
 * - Simple space bar control (Space = Record, Enter = Stop)
 */
interface ZenModeProps {
  question: string;
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
}

export const ZenMode: React.FC<ZenModeProps> = ({
  question,
  onRecordingComplete,
  isProcessing = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number>();
  const chunksRef = useRef<Blob[]>([]);

  // Initialize audio recording on component mount
  useEffect(() => {
    return () => {
      // Cleanup: stop recording if still active
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isProcessing) {
        e.preventDefault();
        if (!isRecording) startRecording();
      } else if (e.code === 'Enter' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isProcessing]);

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Setup audio visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      mediaRecorder.start();
      setIsRecording(true);

      // Start waveform animation
      updateWaveform();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    setIsRecording(false);
    setWaveformData([]);
  };

  const updateWaveform = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Downsample to reasonable number for visualization
    const samples = Array.from(dataArray).splice(0, 64);
    setWaveformData(samples.map(v => v / 255));

    animationIdRef.current = requestAnimationFrame(updateWaveform);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      {/* Question */}
      <div className="max-w-2xl mb-12 text-center">
        <h2 className="text-3xl font-light text-white mb-4">{question}</h2>
        <p className="text-slate-400 text-sm">
          Press <kbd className="bg-slate-700 px-2 py-1 rounded">Space</kbd> to record • 
          <kbd className="bg-slate-700 px-2 py-1 rounded ml-2">Enter</kbd> to finish
        </p>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-12 flex items-center justify-center gap-1 h-24">
        {isRecording && waveformData.length > 0 ? (
          waveformData.map((value, i) => (
            <div
              key={i}
              className="bg-blue-500 rounded-full transition-all"
              style={{
                width: '6px',
                height: `${Math.max(20, value * 100)}px`,
                opacity: 0.8,
              }}
            />
          ))
        ) : (
          <div className="text-slate-500 text-sm flex items-center gap-2">
            <Activity size={20} />
            Ready to record
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className={`flex items-center gap-2 mb-8 px-4 py-2 rounded-lg ${
        isRecording ? 'bg-red-500/20 text-red-200' : 'bg-slate-700/50 text-slate-300'
      }`}>
        {isRecording ? (
          <>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </>
        ) : (
          <>
            <Mic size={18} />
            Ready
          </>
        )}
      </div>

      {/* Control Buttons (Mobile/Accessibility) */}
      {isProcessing ? (
        <div className="text-slate-400 text-sm">Processing...</div>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRecording ? (
              <>
                <Square size={20} /> Stop
              </>
            ) : (
              <>
                <Mic size={20} /> Start Recording
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
