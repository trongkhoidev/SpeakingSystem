import { useState, useEffect, useRef, useCallback } from 'react';

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'failed' | 'unsupported';

interface UseSpeechRecognitionReturn {
  interimTranscript: string;
  finalTranscript: string;
  status: SpeechRecognitionStatus;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setStatus('unsupported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Default to English for IELTS

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        setFinalTranscript(prev => prev + (prev ? ' ' : '') + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        setStatus('failed');
      }
    };

    recognition.onend = () => {
      if (status === 'listening') {
        // Recognition stopped unexpectedly, try to restart if still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          setStatus('idle');
        }
      } else {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
  }, [status]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && status !== 'listening') {
      try {
        recognitionRef.current.start();
        setStatus('listening');
      } catch (e) {
        console.error('Failed to start speech recognition', e);
      }
    }
  }, [status]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && status === 'listening') {
      recognitionRef.current.stop();
      setStatus('idle');
    }
  }, [status]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    interimTranscript,
    finalTranscript,
    status,
    startListening,
    stopListening,
    resetTranscript
  };
}
