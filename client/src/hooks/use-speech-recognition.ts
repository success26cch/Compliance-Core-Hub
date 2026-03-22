import { useState, useEffect, useRef, useCallback } from "react";

export type MicPermission = "unknown" | "granted" | "denied" | "prompt";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<MicPermission>("unknown");
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const shouldBeListeningRef = useRef(false);
  const restartingRef = useRef(false);
  // Text finalized in previous sessions (carried over when session auto-restarts)
  const crossSessionFinalsRef = useRef("");
  // Finals seen in the current session (rebuilt fresh from event.results each event)
  const lastSessionFinalsRef = useRef("");

  onTranscriptRef.current = onTranscript;

  const speechSupported = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const scheduleRestart = useCallback((recognition: any) => {
    if (restartingRef.current) return;
    restartingRef.current = true;
    setTimeout(() => {
      restartingRef.current = false;
      if (!shouldBeListeningRef.current) return;
      try { recognition.start(); } catch (_) {}
    }, 300);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;      // Don't cut off on pauses
    recognition.interimResults = true;  // Show text while speaking
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      // Rebuild current session's transcript from scratch on every event.
      // This avoids duplication — event.results already contains the full
      // state for this session, so we never need to += across events.
      let sessionFinals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) sessionFinals += r[0].transcript;
        else interim += r[0].transcript;
      }
      // Track what's been finalized this session so we can carry it over
      // if the session auto-restarts (common on Android PWA)
      lastSessionFinalsRef.current = sessionFinals;

      // Full transcript = everything from previous sessions + this session
      const combined = (crossSessionFinalsRef.current + sessionFinals + interim).trim();
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
      if (event.error === "aborted" || event.error === "no-speech") return;
      console.warn("[SpeechRecognition] error:", event.error);
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        // Session ended but user is still listening — carry over finals and restart
        crossSessionFinalsRef.current += lastSessionFinalsRef.current;
        lastSessionFinalsRef.current = "";
        scheduleRestart(recognition);
      } else {
        // User intentionally stopped
        crossSessionFinalsRef.current = "";
        lastSessionFinalsRef.current = "";
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
      crossSessionFinalsRef.current = "";
      lastSessionFinalsRef.current = "";
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

    // Fresh start — clear any previous session state
    crossSessionFinalsRef.current = "";
    lastSessionFinalsRef.current = "";
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
    crossSessionFinalsRef.current = "";
    lastSessionFinalsRef.current = "";
    try { recognitionRef.current.stop(); } catch (_) {}
    setIsListening(false);
  }, [isListening]);

  return { isListening, speechSupported, toggleListening, stopListening, permissionStatus };
}
