import { useState, useCallback, useEffect } from 'react';
import { useDeepgram, DeepgramStatus } from './useDeepgram';
import { useSpeechRecognition, SpeechRecognitionStatus } from './useSpeechRecognition';

export type TranscriptionStatus = DeepgramStatus | SpeechRecognitionStatus | 'fallback';

interface UseTranscriptionReturn {
  interimTranscript: string;
  finalTranscript: string;
  status: TranscriptionStatus;
  isFallback: boolean;
  startTranscribing: (stream: MediaStream) => Promise<void>;
  stopTranscribing: () => void;
  resetTranscript: () => void;
}

export function useTranscription(): UseTranscriptionReturn {
  const deepgram = useDeepgram();
  const browser = useSpeechRecognition();
  const [isFallback, setIsFallback] = useState(false);

  // If Deepgram fails, switch to fallback
  useEffect(() => {
    if (deepgram.status === 'failed' && !isFallback && browser.status !== 'unsupported') {
      console.warn("Deepgram failed, falling back to Browser Speech Recognition");
      setIsFallback(true);
      browser.startListening();
    }
  }, [deepgram.status, isFallback, browser]);

  const startTranscribing = useCallback(async (stream: MediaStream) => {
    setIsFallback(false);
    deepgram.resetTranscript();
    browser.resetTranscript();
    
    // Always try Deepgram first
    await deepgram.startTranscribing(stream);
  }, [deepgram, browser]);

  const stopTranscribing = useCallback(() => {
    deepgram.stopTranscribing();
    browser.stopListening();
  }, [deepgram, browser]);

  const resetTranscript = useCallback(() => {
    deepgram.resetTranscript();
    browser.resetTranscript();
  }, [deepgram, browser]);

  const interimTranscript = isFallback ? browser.interimTranscript : deepgram.interimTranscript;
  const finalTranscript = isFallback ? browser.finalTranscript : deepgram.finalTranscript;
  const status = isFallback ? (browser.status as TranscriptionStatus) : (deepgram.status as TranscriptionStatus);

  return {
    interimTranscript,
    finalTranscript,
    status,
    isFallback,
    startTranscribing,
    stopTranscribing,
    resetTranscript
  };
}
