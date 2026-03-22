import { useState, useEffect, useRef, useCallback } from "react";

export type MicPermission = "unknown" | "granted" | "denied" | "prompt";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<MicPermission>("unknown");
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const shouldBeListeningRef = useRef(false);
  const restartingRef = useRef(false);
  const failCountRef = useRef(0);

  onTranscriptRef.current = onTranscript;

  const speechSupported = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const scheduleRestart = useCallback((recognition: any) => {
    if (restartingRef.current) return;
    restartingRef.current = true;
    setTimeout(() => {
      restartingRef.current = false;
      if (!shouldBeListeningRef.current) return;
      try {
        recognition.start();
      } catch (_) {}
    }, 350);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      failCountRef.current = 0;
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
      if (combined) onTranscriptRef.current(combined);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setPermissionStatus("denied");
        shouldBeListeningRef.current = false;
        restartingRef.current = false;
        setIsListening(false);
        return;
      }
      if (event.error === "aborted") return;
      if (event.error === "no-speech") return;

      failCountRef.current += 1;
      console.warn("[SpeechRecognition] error:", event.error, "— fail count:", failCountRef.current);

      if (failCountRef.current >= 5) {
        console.error("[SpeechRecognition] Too many consecutive errors — stopping");
        shouldBeListeningRef.current = false;
        restartingRef.current = false;
        setIsListening(false);
        failCountRef.current = 0;
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        scheduleRestart(recognition);
      } else {
        restartingRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((result) => {
          setPermissionStatus(result.state as MicPermission);
          result.addEventListener("change", () => {
            setPermissionStatus(result.state as MicPermission);
          });
        })
        .catch(() => {});
    }

    return () => {
      shouldBeListeningRef.current = false;
      restartingRef.current = false;
      try { recognition.abort(); } catch (_) {}
    };
  }, [scheduleRestart]);

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      shouldBeListeningRef.current = false;
      restartingRef.current = false;
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsListening(false);
      return;
    }

    if (permissionStatus !== "granted") {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionStatus("denied");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissionStatus("granted");
      } catch (_) {
        setPermissionStatus("denied");
        return;
      }
    }

    failCountRef.current = 0;
    shouldBeListeningRef.current = true;
    restartingRef.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (_) {
      shouldBeListeningRef.current = false;
      setIsListening(false);
    }
  }, [isListening, permissionStatus]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    shouldBeListeningRef.current = false;
    restartingRef.current = false;
    try { recognitionRef.current.stop(); } catch (_) {}
    setIsListening(false);
  }, [isListening]);

  return { isListening, speechSupported, toggleListening, stopListening, permissionStatus };
}
