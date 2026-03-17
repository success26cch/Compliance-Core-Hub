import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const shouldBeListeningRef = useRef(false);
  const fullTranscriptRef = useRef("");
  const micStreamRef = useRef<MediaStream | null>(null);
  const permissionWarmedRef = useRef(false);
  onTranscriptRef.current = onTranscript;

  const speechSupported = typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      const combined = (finalText + " " + interimText).trim();
      if (combined) {
        onTranscriptRef.current(combined);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' && shouldBeListeningRef.current) {
        try {
          recognition.stop();
          setTimeout(() => {
            if (shouldBeListeningRef.current) recognition.start();
          }, 100);
        } catch (e) {}
        return;
      }
      if (event.error === 'aborted') return;
      console.error('Speech recognition error:', event.error);
      shouldBeListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        try {
          setTimeout(() => {
            if (shouldBeListeningRef.current) recognition.start();
          }, 100);
        } catch (e) {
          shouldBeListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    // Pre-warm microphone permission immediately on mount.
    // This silently requests mic access so the browser has already granted it
    // by the time the user clicks Listen — eliminating the 20-30s first-use delay.
    if (!permissionWarmedRef.current && navigator.mediaDevices?.getUserMedia) {
      permissionWarmedRef.current = true;
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Keep stream alive so the mic stays warm — stop tracks only on unmount
          micStreamRef.current = stream;
        })
        .catch(() => {
          // Permission denied or unavailable — recognition will still work,
          // browser will show its own prompt when user clicks Listen
        });
    }

    return () => {
      shouldBeListeningRef.current = false;
      recognition.abort();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      shouldBeListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      fullTranscriptRef.current = "";
      shouldBeListeningRef.current = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        shouldBeListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      shouldBeListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, speechSupported, toggleListening, stopListening };
}
