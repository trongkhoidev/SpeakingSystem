import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

interface UseDeepgramReturn {
  interimTranscript: string;
  finalTranscript: string;
  isReady: boolean;
  startTranscribing: (stream: MediaStream) => void;
  stopTranscribing: () => void;
}

export function useDeepgram(): UseDeepgramReturn {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isReady, setIsReady] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startTranscribing = useCallback(async (stream: MediaStream) => {
    try {
      // 1. Get the API key from our backend
      const response = await api.get('/auth/config/deepgram');
      const apiKey = response.data.api_key;

      if (!apiKey) {
        console.error("Deepgram API key not found");
        return;
      }

      // 2. Open WebSocket
      const url = 'wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&interim_results=true';
      socketRef.current = new WebSocket(url, ['token', apiKey]);

      socketRef.current.onopen = () => {
        setIsReady(true);
        console.log("Deepgram connection opened");

        // Start media recorder to stream to Deepgram
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send 250ms chunks
      };

      socketRef.current.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;

        if (transcript && received.is_final) {
          setFinalTranscript(prev => prev + (prev ? ' ' : '') + transcript);
          setInterimTranscript('');
        } else if (transcript) {
          setInterimTranscript(transcript);
        }
      };

      socketRef.current.onclose = () => {
        setIsReady(false);
        console.log("Deepgram connection closed");
      };

      socketRef.current.onerror = (error) => {
        console.error("Deepgram error:", error);
      };

    } catch (err) {
      console.error("Failed to start Deepgram:", err);
    }
  }, []);

  const stopTranscribing = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (socketRef.current) {
      // Send a closing message to Deepgram
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsReady(false);
  }, []);

  useEffect(() => {
    return () => {
      stopTranscribing();
    };
  }, [stopTranscribing]);

  return {
    interimTranscript,
    finalTranscript,
    isReady,
    startTranscribing,
    stopTranscribing
  };
}
