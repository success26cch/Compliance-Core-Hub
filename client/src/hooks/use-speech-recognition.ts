import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export type MicPermission = "unknown" | "granted" | "denied" | "prompt";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<MicPermission>("unknown");
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const shouldBeListeningRef = useRef(false);
  const restartingRef = useRef(false);
  const crossSessionFinalsRef = useRef("");
  const lastSessionFinalsRef = useRef("");
  const { toast } = useToast();

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
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let sessionFinals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) sessionFinals += r[0].transcript;
        else interim += r[0].transcript;
      }
      lastSessionFinalsRef.current = sessionFinals;
      const combined = (crossSessionFinalsRef.current + sessionFinals + interim).trim();
      if (combined) onTranscriptRef.current(combined);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setPermissionStatus("denied");
        shouldBeListeningRef.current = false;
        restartingRef.current = false;
        setIsListening(false);
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access in your browser settings and try again.",
          variant: "destructive",
        });
        return;
      }
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("[SpeechRecognition] error:", event.error);
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        crossSessionFinalsRef.current += lastSessionFinalsRef.current;
        lastSessionFinalsRef.current = "";
        scheduleRestart(recognition);
      } else {
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
  }, [scheduleRestart, toast]);

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

    // Explicitly request mic permission — required for PWA installs and first-time use
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionStatus("granted");
    } catch (_) {
      setPermissionStatus("denied");
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser or device settings, then try again.",
        variant: "destructive",
      });
      return;
    }

    crossSessionFinalsRef.current = "";
    lastSessionFinalsRef.current = "";
    shouldBeListeningRef.current = true;
    restartingRef.current = false;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      shouldBeListeningRef.current = false;
      setIsListening(false);
      if (err?.name !== "InvalidStateError") {
        toast({
          title: "Could Not Start Microphone",
          description: "Voice input failed to start. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [isListening, toast]);

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
