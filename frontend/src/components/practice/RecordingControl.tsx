import React, { useState, useEffect } from 'react';
import { Mic, Square, Play } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RecordingControlProps {
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onPlayback: () => void;
  isRecording: boolean;
  hasRecording: boolean;
  recordingTime?: number;
}

export function RecordingControl({
  onRecordingStart,
  onRecordingStop,
  onPlayback,
  isRecording,
  hasRecording,
  recordingTime = 0,
}: RecordingControlProps) {
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setDisplayTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setDisplayTime(0);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Recording Status */}
      {isRecording && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-700">Recording in progress...</span>
          <span className="ml-auto text-sm font-semibold text-red-600">
            {formatTime(displayTime)}
          </span>
        </div>
      )}

      {/* Recording Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={isRecording ? onRecordingStop : onRecordingStart}
          className={cn(
            'py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border-2',
            isRecording
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 active:scale-95'
              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95'
          )}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Recording
            </>
          )}
        </button>

        <button
          onClick={onPlayback}
          disabled={!hasRecording}
          className={cn(
            'py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border-2',
            hasRecording
              ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 active:scale-95'
              : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
          )}
        >
          <Play className="w-4 h-4" />
          Play Back
        </button>
      </div>
    </div>
  );
}
