import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";

export default function BmaPatientPhone() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "sending" | "sent" | "error">("idle");
  const [messageCount, setMessageCount] = useState(0);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/bma-phone-session/${sessionId}/messages`)
      .then(r => setSessionValid(r.status !== 404))
      .catch(() => setSessionValid(false));
  }, [sessionId]);

  const sendText = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId) return;
    setStatus("sending");
    try {
      const r = await fetch(`/api/bma-phone-session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (r.ok) {
        setStatus("sent");
        setMessageCount(c => c + 1);
        setTranscript("");
        transcriptRef.current = "";
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [sessionId]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Your browser doesn't support voice input. Please use Chrome on Android or Safari on iPhone.");
      return;
    }

    const r = new SR();
    r.lang = "es-MX";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => setIsListening(true);

    r.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const current = (final || interim).trim();
      transcriptRef.current = current;
      setTranscript(current);
      if (final.trim()) {
        r.stop();
      }
    };

    r.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (transcriptRef.current.trim()) {
        sendText(transcriptRef.current);
      }
    };

    r.onerror = (e: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (e.error === "not-allowed") {
        alert("Microphone access was denied. Please allow microphone access in your browser settings and try again.");
      }
    };

    recognitionRef.current = r;
    r.start();
  }, [sendText]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-white mb-2">Session Expired</h1>
        <p className="text-gray-400 text-sm">This session has expired or is no longer active. Please ask the provider to generate a new QR code.</p>
        <p className="text-gray-500 text-sm mt-2">Esta sesión ha expirado. Pida al proveedor un nuevo código QR.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-between px-5 py-8 select-none">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-4 py-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-semibold tracking-wide">CONNECTED TO PROVIDER</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Bilingual Medical Assistant</h1>
          <p className="text-gray-400 text-sm">Asistente Médico Bilingüe</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-white text-sm font-semibold text-center">
            🇲🇽 Hable en español — su médico leerá su mensaje
          </p>
          <p className="text-gray-400 text-xs text-center">
            Speak in Spanish — your provider will see your message
          </p>
        </div>

        {transcript && (
          <div className="bg-green-950/50 border border-green-700/50 rounded-xl p-4 mb-5">
            <p className="text-xs text-green-400 font-semibold mb-1">Lo que dijo / What you said:</p>
            <p className="text-white text-sm leading-relaxed">{transcript}</p>
          </div>
        )}

        {status === "sent" && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-5 text-center animate-pulse">
            <p className="text-green-300 font-bold text-sm">✓ Mensaje enviado / Message sent!</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-5 text-center">
            <p className="text-red-300 font-bold text-sm">Error sending. Please try again.</p>
          </div>
        )}

        <button
          onClick={isListening ? stopListening : startListening}
          disabled={status === "sending"}
          className={`w-full py-6 rounded-2xl font-black text-lg transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-2 ${
            isListening
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
              : status === "sending"
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-400"
          }`}
        >
          <span className="text-4xl">
            {status === "sending" ? "⏳" : isListening ? "🛑" : "🎙️"}
          </span>
          <span>
            {status === "sending"
              ? "Sending… / Enviando…"
              : isListening
              ? "Stop / Parar"
              : "Tap to Speak / Toque para hablar"}
          </span>
          {isListening && (
            <span className="text-sm font-normal opacity-80">Listening… / Escuchando…</span>
          )}
        </button>

        <div className="mt-6">
          <label className="text-xs text-gray-500 mb-2 block text-center">Or type in Spanish / O escriba en español</label>
          <textarea
            value={transcript}
            onChange={e => { setTranscript(e.target.value); transcriptRef.current = e.target.value; }}
            rows={3}
            placeholder="Escriba aquí en español…"
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-green-500 placeholder:text-gray-500"
          />
          <button
            onClick={() => sendText(transcript)}
            disabled={!transcript.trim() || status === "sending"}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Send / Enviar
          </button>
        </div>

        {messageCount > 0 && (
          <p className="text-center text-gray-500 text-xs mt-5">
            {messageCount} message{messageCount !== 1 ? "s" : ""} sent this session
          </p>
        )}
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-600 text-xs">Core Compliance Hub — BMA</p>
        <p className="text-gray-700 text-xs">Powered by CCHUB • corecompliancehub.com</p>
      </div>
    </div>
  );
}
