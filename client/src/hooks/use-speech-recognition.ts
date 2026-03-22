import { useState, useEffect, useRef, useCallback } from "react";

export type MicPermission = "unknown" | "granted" | "denied" | "prompt";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<MicPermission>("unknown");
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const shouldBeListeningRef = useRef(false);
  const restartingRef = useRef(false);
  // Accumulated finals from all completed sessions
  const crossSessionFinalsRef = useRef("");
  // Finals seen in the current session
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
    }, 250);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    // continuous: false — each session ends cleanly after a pause, with NO
    // audio buffer re-processing on the next start. This prevents duplication.
    // We auto-restart in onend so the user never experiences a cutoff.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      // Rebuild this session's transcript from scratch every event.
      // event.results holds the full state for this session — no need to +=.
      let sessionFinals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) sessionFinals += r[0].transcript;
        else interim += r[0].transcript;
      }
      lastSessionFinalsRef.current = sessionFinals;

      // Full transcript = everything finalized in past sessions + this session
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
      // no-speech and aborted are non-fatal — onend will fire and restart
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("[SpeechRecognition] error:", event.error);
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        // Session ended naturally (pause detected). Save what was finalized
        // and immediately restart — continuous: false gives us a clean buffer
        // so the new session won't re-process old audio (no duplication).
        crossSessionFinalsRef.current += lastSessionFinalsRef.current;
        lastSessionFinalsRef.current = "";
        scheduleRestart(recognition);
      } else {
        // User tapped mic to stop
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
