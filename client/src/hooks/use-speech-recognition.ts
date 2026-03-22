import { useState, useEffect, useRef, useCallback } from "react";

export type MicPermission = "unknown" | "granted" | "denied" | "prompt";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<MicPermission>("unknown");
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const activeRef = useRef(false);

  onTranscriptRef.current = onTranscript;

  const speechSupported = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    // Single-utterance mode: no restarts, no accumulation, no race conditions.
    // continuous:true causes Android PWA to restart sessions constantly,
    // which produces duplicated/combined words. One clear utterance per tap
    // is correct for a chat input.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finals += r[0].transcript;
        else interim += r[0].transcript;
      }
      const combined = (finals + interim).trim();
      if (combined) onTranscriptRef.current(combined);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setPermissionStatus("denied");
      }
      // Ignore no-speech and aborted — onend will fire and clean up
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("[SpeechRecognition] error:", event.error);
      }
      activeRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      activeRef.current = false;
      setIsListening(false);
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
      activeRef.current = false;
      try { recognition.abort(); } catch (_) {}
    };
  }, []);

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      activeRef.current = false;
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsListening(false);
      return;
    }

    // Request mic permission explicitly on first tap — required for PWA installs
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

    try {
      activeRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (_) {
      activeRef.current = false;
      setIsListening(false);
    }
  }, [isListening, permissionStatus]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    activeRef.current = false;
    try { recognitionRef.current.stop(); } catch (_) {}
    setIsListening(false);
  }, [isListening]);

  return { isListening, speechSupported, toggleListening, stopListening, permissionStatus };
}
