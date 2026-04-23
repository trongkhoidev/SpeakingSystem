import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

export type DeepgramStatus = 'idle' | 'connecting' | 'listening' | 'failed' | 'closed';

interface UseDeepgramReturn {
  interimTranscript: string;
  finalTranscript: string;
  status: DeepgramStatus;
  startTranscribing: (stream: MediaStream) => Promise<void>;
  stopTranscribing: () => void;
  resetTranscript: () => void;
}

export function useDeepgram(): UseDeepgramReturn {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [status, setStatus] = useState<DeepgramStatus>('idle');
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  const stopTranscribing = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("MediaRecorder stop failed:", e);
      }
      mediaRecorderRef.current = null;
    }
    
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setStatus('closed');
  }, []);

  const startTranscribing = useCallback(async (stream: MediaStream) => {
    if (socketRef.current) {
      stopTranscribing();
    }

    setStatus('connecting');

    try {
      // 1. Get the API key from backend
      // Using a fallback or cached key mechanism could be better for latency, 
      // but following the current pattern for now.
      const response = await api.get('/auth/config/deepgram');
      const apiKey = response.data.api_key;

      if (!apiKey) {
        throw new Error("Deepgram API key not found");
      }

      // 2. Open WebSocket with optimized parameters
      // model=nova-3: Latest high-speed model
      // smart_format=true: Better punctuation
      // interim_results=true: For live feedback
      // endpointing=300: Wait 300ms of silence before finishing a sentence
      const url = 'wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&interim_results=true&endpointing=300';
      const socket = new WebSocket(url, ['token', apiKey]);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus('listening');
        console.log("Deepgram connected");

        // Start media recorder to stream to Deepgram
        // We use a small timeslice (250ms) to ensure low latency
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250); 
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;

        if (transcript) {
          if (received.is_final) {
            setFinalTranscript(prev => prev + (prev ? ' ' : '') + transcript);
            setInterimTranscript('');
          } else {
            setInterimTranscript(transcript);
          }
        }
      };

      socket.onclose = () => {
        console.log("Deepgram connection closed");
        if (status !== 'closed') setStatus('closed');
      };

      socket.onerror = (error) => {
        console.error("Deepgram WebSocket error:", error);
        setStatus('failed');
      };

    } catch (err) {
      console.error("Failed to initialize Deepgram:", err);
      setStatus('failed');
    }
  }, [stopTranscribing, status]);

  useEffect(() => {
    return () => {
      stopTranscribing();
    };
  }, [stopTranscribing]);

  return {
    interimTranscript,
    finalTranscript,
    status,
    startTranscribing,
    stopTranscribing,
    resetTranscript
  };
}
