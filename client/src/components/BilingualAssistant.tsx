import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Volume2,
  Mic,
  MicOff,
  ClipboardCheck,
  UserPlus,
  FlaskConical,
  ChevronRight,
  ChevronLeft,
  FileText,
  Printer,
  Languages,
  Stethoscope,
  Eye,
  Wind,
  Droplets,
  HandMetal,
  AlertTriangle,
} from "lucide-react";

type Mode = "injury" | "intake" | "drugscreen";

const BODY_PARTS = [
  { en: "Head", es: "Cabeza", region: "upper" },
  { en: "Neck", es: "Cuello", region: "upper" },
  { en: "Right Shoulder", es: "Hombro derecho", region: "upper" },
  { en: "Left Shoulder", es: "Hombro izquierdo", region: "upper" },
  { en: "Right Arm", es: "Brazo derecho", region: "upper" },
  { en: "Left Arm", es: "Brazo izquierdo", region: "upper" },
  { en: "Right Wrist", es: "Muñeca derecha", region: "upper" },
  { en: "Left Wrist", es: "Muñeca izquierda", region: "upper" },
  { en: "Right Hand", es: "Mano derecha", region: "upper" },
  { en: "Left Hand", es: "Mano izquierda", region: "upper" },
  { en: "Chest", es: "Pecho", region: "torso" },
  { en: "Upper Back", es: "Espalda superior", region: "torso" },
  { en: "Lower Back", es: "Espalda baja", region: "torso" },
  { en: "Abdomen", es: "Abdomen", region: "torso" },
  { en: "Right Hip", es: "Cadera derecha", region: "lower" },
  { en: "Left Hip", es: "Cadera izquierda", region: "lower" },
  { en: "Right Knee", es: "Rodilla derecha", region: "lower" },
  { en: "Left Knee", es: "Rodilla izquierda", region: "lower" },
  { en: "Right Ankle", es: "Tobillo derecho", region: "lower" },
  { en: "Left Ankle", es: "Tobillo izquierdo", region: "lower" },
  { en: "Right Foot", es: "Pie derecho", region: "lower" },
  { en: "Left Foot", es: "Pie izquierdo", region: "lower" },
  { en: "Eyes", es: "Ojos", region: "upper" },
  { en: "Ears", es: "Oídos", region: "upper" },
];

const CLINIC_INSTRUCTIONS = [
  {
    category: "Vision Test",
    icon: Eye,
    commands: [
      { en: "Read the smallest line you can see clearly.", es: "Lea la línea más pequeña que pueda ver con claridad." },
      { en: "Cover your left eye.", es: "Cúbrase el ojo izquierdo." },
      { en: "Cover your right eye.", es: "Cúbrase el ojo derecho." },
    ],
  },
  {
    category: "Physical Exam",
    icon: Stethoscope,
    commands: [
      { en: "Turn your head and cough.", es: "Gire la cabeza y tosa." },
      { en: "Take a deep breath and hold it.", es: "Respire profundo y manténgalo." },
      { en: "Breathe deeply.", es: "Respire profundo." },
      { en: "Raise both arms above your head.", es: "Levante ambos brazos por encima de la cabeza." },
      { en: "Touch your toes.", es: "Toque las puntas de sus pies." },
    ],
  },
  {
    category: "Drug Screen",
    icon: FlaskConical,
    commands: [
      { en: "Do not flush the toilet or turn on the faucet.", es: "No le baje al agua al inodoro ni abra el grifo." },
      { en: "Please remove your jacket and empty your pockets.", es: "Por favor, quítese la chaqueta y vacíe sus bolsillos." },
      { en: "You must provide a minimum of 45mL.", es: "Debe proporcionar un mínimo de 45mL." },
      { en: "Do not wash your hands until instructed.", es: "No se lave las manos hasta que se le indique." },
    ],
  },
  {
    category: "Breathing / PFT",
    icon: Wind,
    commands: [
      { en: "Blow as hard and as long as you can.", es: "Sople tan fuerte y por tanto tiempo como pueda." },
      { en: "Seal your lips tightly around the mouthpiece.", es: "Selle los labios firmemente alrededor de la boquilla." },
      { en: "Breathe in deeply, then blow out fast.", es: "Inhale profundamente, luego exhale rápidamente." },
    ],
  },
  {
    category: "Blood Draw",
    icon: Droplets,
    commands: [
      { en: "Make a fist.", es: "Cierre el puño." },
      { en: "Are you allergic to latex?", es: "¿Es alérgico(a) al látex?" },
      { en: "Have you eaten today?", es: "¿Ha comido hoy?" },
      { en: "You may feel a small pinch.", es: "Puede sentir un pequeño pinchazo." },
    ],
  },
  {
    category: "Medical History",
    icon: ClipboardCheck,
    commands: [
      { en: "Are you taking any blood pressure or heart medications?", es: "¿Está tomando medicamentos para la presión arterial o el corazón?" },
      { en: "Have you had any surgeries?", es: "¿Ha tenido alguna cirugía?" },
      { en: "Do you have diabetes?", es: "¿Tiene diabetes?" },
      { en: "Are you currently pregnant?", es: "¿Está embarazada actualmente?" },
      { en: "Do you have any allergies?", es: "¿Tiene alguna alergia?" },
    ],
  },
];

const DRUG_SCREEN_STEPS = [
  {
    stepNum: 1,
    title: "Identification",
    titleEs: "Identificación",
    en: "Present a valid photo ID (driver's license or passport). The collector will verify your identity.",
    es: "Presente una identificación con foto válida (licencia de conducir o pasaporte). El recolector verificará su identidad.",
  },
  {
    stepNum: 2,
    title: "Preparation",
    titleEs: "Preparación",
    en: "Remove your jacket and empty all pockets. Leave personal belongings in the designated area. No bags, phones, or containers allowed in the collection area.",
    es: "Quítese la chaqueta y vacíe todos sus bolsillos. Deje sus pertenencias personales en el área designada. No se permiten bolsas, teléfonos ni contenedores en el área de recolección.",
  },
  {
    stepNum: 3,
    title: "Collection",
    titleEs: "Recolección",
    en: "You must provide a minimum of 45mL of urine. The water in the toilet will be colored. Do NOT flush the toilet or turn on the faucet until instructed.",
    es: "Debe proporcionar un mínimo de 45mL de orina. El agua del inodoro estará teñida. NO baje el agua del inodoro ni abra el grifo hasta que se le indique.",
  },
  {
    stepNum: 4,
    title: "Temperature Check",
    titleEs: "Verificación de temperatura",
    en: "The collector will check the specimen temperature within 4 minutes. The temperature must be between 90°F and 100°F (32°C–38°C).",
    es: "El recolector verificará la temperatura de la muestra dentro de 4 minutos. La temperatura debe estar entre 90°F y 100°F (32°C–38°C).",
  },
  {
    stepNum: 5,
    title: "Chain of Custody",
    titleEs: "Cadena de custodia",
    en: "You will observe the collector seal the specimen with tamper-evident tape. Initial the seal and verify all information on the Chain of Custody Form (CCF).",
    es: "Usted observará al recolector sellar la muestra con cinta a prueba de manipulaciones. Firme el sello y verifique toda la información en el formulario de Cadena de Custodia (CCF).",
  },
];

interface IntakeData {
  firstName: string;
  lastName: string;
  dob: string;
  medications: string;
  surgeries: string;
  conditions: string[];
  allergies: string;
  notes: string;
}

interface InjuryData {
  employeeName: string;
  dateOfInjury: string;
  bodyParts: string[];
  description: string;
  mechanism: string;
  witnessed: string;
}

function speakSpanish(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

function CommandCenterMode() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">Staff Command Center</h3>
        <Badge className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">
          <Volume2 className="w-3 h-3 mr-1" /> Text-to-Speech
        </Badge>
      </div>
      <p className="text-sm text-gray-400">Click any button to speak the instruction in Spanish to the patient.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {CLINIC_INSTRUCTIONS.map((cat, i) => (
          <Button
            key={cat.category}
            size="sm"
            variant={activeCategory === i ? "default" : "outline"}
            className={activeCategory === i
              ? "bg-[#FFC107] text-black"
              : "border-gray-600 text-gray-300"
            }
            onClick={() => setActiveCategory(i)}
            data-testid={`btn-category-${cat.category.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <cat.icon className="w-4 h-4 mr-1" />
            {cat.category}
          </Button>
        ))}
      </div>

      <div className="grid gap-2">
        {CLINIC_INSTRUCTIONS[activeCategory].commands.map((cmd, j) => (
          <button
            key={j}
            onClick={() => speakSpanish(cmd.es)}
            className="flex items-start gap-3 p-3 rounded-md bg-gray-800/60 border border-gray-700 hover:border-[#FFC107]/50 hover:bg-gray-800 transition-all text-left group"
            data-testid={`btn-speak-${activeCategory}-${j}`}
          >
            <div className="mt-0.5 w-8 h-8 rounded-full bg-[#FFC107]/20 flex items-center justify-center shrink-0 group-hover:bg-[#FFC107]/30 transition-colors">
              <Volume2 className="w-4 h-4 text-[#FFC107]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#FFC107]">{cmd.es}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cmd.en}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function InjuryReportingMode() {
  const [data, setData] = useState<InjuryData>({
    employeeName: "",
    dateOfInjury: "",
    bodyParts: [],
    description: "",
    mechanism: "",
    witnessed: "",
  });
  const [showSummary, setShowSummary] = useState(false);
  const [bodyRegion, setBodyRegion] = useState<string>("upper");
  const summaryRef = useRef<HTMLDivElement>(null);
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const translateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const translateText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setTranslatedDescription("");
      return;
    }
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const { translation } = await res.json();
        setTranslatedDescription(translation);
      }
    } catch {
      setTranslatedDescription("");
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setData((prev) => ({ ...prev, description: value }));
    if (translateTimerRef.current) clearTimeout(translateTimerRef.current);
    translateTimerRef.current = setTimeout(() => translateText(value), 800);
  }, [translateText]);

  const toggleSpeechToText = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = data.description;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
          handleDescriptionChange(finalTranscript);
        } else {
          interim = transcript;
        }
      }
      if (interim) {
        setData((prev) => ({ ...prev, description: finalTranscript + (finalTranscript ? " " : "") + interim }));
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setIsListening(true);
  }, [isListening, data.description, handleDescriptionChange]);

  useEffect(() => {
    return () => {
      if (translateTimerRef.current) clearTimeout(translateTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleBodyPart = (part: string) => {
    setData((prev) => ({
      ...prev,
      bodyParts: prev.bodyParts.includes(part)
        ? prev.bodyParts.filter((p) => p !== part)
        : [...prev.bodyParts, part],
    }));
  };

  const handlePrint = () => {
    if (summaryRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Injury Report - CCH</title>
          <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a2e}
          h1{color:#1a1a2e;border-bottom:2px solid #FFC107;padding-bottom:8px}
          .field{margin:12px 0}.label{font-weight:bold;color:#555}.value{margin-top:4px}
          .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:16px;font-size:12px;color:#888}</style>
          </head><body>
          <h1>Workplace Injury Report</h1>
          <p style="color:#888">Core Compliance Hub - Generated ${new Date().toLocaleDateString()}</p>
          <div class="field"><span class="label">Employee:</span><div class="value">${data.employeeName || "N/A"}</div></div>
          <div class="field"><span class="label">Date of Injury:</span><div class="value">${data.dateOfInjury || "N/A"}</div></div>
          <div class="field"><span class="label">Body Parts Affected:</span><div class="value">${data.bodyParts.join(", ") || "None selected"}</div></div>
          <div class="field"><span class="label">Mechanism of Injury:</span><div class="value">${data.mechanism || "N/A"}</div></div>
          <div class="field"><span class="label">Description (Original):</span><div class="value">${data.description || "N/A"}</div></div>
          ${translatedDescription ? `<div class="field"><span class="label">Description (English Translation):</span><div class="value">${translatedDescription}</div></div>` : ""}
          <div class="field"><span class="label">Witnessed:</span><div class="value">${data.witnessed || "N/A"}</div></div>
          <div class="footer">This report was generated by Core Compliance Hub (CCH) Bilingual Medical Assistant. For clinical review only.</div>
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (showSummary) {
    return (
      <div ref={summaryRef} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FFC107]" />
            Injury Report Summary
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300" onClick={() => setShowSummary(false)} data-testid="btn-injury-back">
              <ChevronLeft className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button size="sm" className="bg-[#FFC107] text-black" onClick={handlePrint} data-testid="btn-injury-print">
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800/60 border-gray-700 p-4 space-y-3">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Employee</span>
            <p className="text-white font-medium">{data.employeeName || "N/A"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Date of Injury</span>
            <p className="text-white font-medium">{data.dateOfInjury || "N/A"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Body Parts Affected</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.bodyParts.length > 0 ? data.bodyParts.map((p) => (
                <Badge key={p} className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">{p}</Badge>
              )) : <span className="text-gray-500 text-sm">None selected</span>}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Mechanism</span>
            <p className="text-white font-medium">{data.mechanism || "N/A"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Description (Original)</span>
            <p className="text-white font-medium">{data.description || "N/A"}</p>
          </div>
          {translatedDescription && (
            <div>
              <span className="text-xs text-[#FFC107] uppercase tracking-wide flex items-center gap-1">
                <Languages className="w-3 h-3" /> English Translation
              </span>
              <p className="text-white font-medium">{translatedDescription}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Witnessed</span>
            <p className="text-white font-medium">{data.witnessed || "N/A"}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">Injury Reporting</h3>
        <span className="text-sm text-gray-400">/ Reporte de Lesiones</span>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Employee Name / Nombre del empleado</label>
          <Input
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500"
            placeholder="Full name"
            value={data.employeeName}
            onChange={(e) => setData({ ...data, employeeName: e.target.value })}
            data-testid="input-injury-name"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Date of Injury / Fecha de lesión</label>
          <Input
            type="date"
            className="bg-gray-800/60 border-gray-700 text-white"
            value={data.dateOfInjury}
            onChange={(e) => setData({ ...data, dateOfInjury: e.target.value })}
            data-testid="input-injury-date"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 block">Body Part Affected / Parte del cuerpo afectada</label>
        <div className="flex gap-2 mb-2">
          {["upper", "torso", "lower"].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={bodyRegion === r ? "default" : "outline"}
              className={bodyRegion === r
                ? "bg-[#FFC107] text-black"
                : "border-gray-600 text-gray-300"
              }
              onClick={() => setBodyRegion(r)}
              data-testid={`btn-region-${r}`}
            >
              {r === "upper" ? "Head / Arms" : r === "torso" ? "Torso" : "Legs / Feet"}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {BODY_PARTS.filter((p) => p.region === bodyRegion).map((part) => (
            <button
              key={part.en}
              onClick={() => toggleBodyPart(part.en)}
              className={`p-2 rounded-md text-left text-sm transition-all border ${
                data.bodyParts.includes(part.en)
                  ? "bg-[#FFC107]/20 border-[#FFC107]/50 text-[#FFC107]"
                  : "bg-gray-800/40 border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
              data-testid={`btn-body-${part.en.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className="font-medium">{part.en}</span>
              <span className="block text-xs opacity-70">{part.es}</span>
            </button>
          ))}
        </div>
        {data.bodyParts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.bodyParts.map((p) => (
              <Badge
                key={p}
                className="bg-[#FFC107]/20 text-[#FFC107] cursor-pointer no-default-hover-elevate"
                onClick={() => toggleBodyPart(p)}
              >
                {p} x
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Mechanism of Injury / Mecanismo de lesión</label>
        <select
          className="w-full rounded-md bg-gray-800/60 border border-gray-700 text-white p-2 text-sm"
          value={data.mechanism}
          onChange={(e) => setData({ ...data, mechanism: e.target.value })}
          data-testid="select-injury-mechanism"
        >
          <option value="">Select / Seleccione</option>
          <option value="Struck by object">Struck by object / Golpeado por objeto</option>
          <option value="Fall (same level)">Fall - same level / Caída al mismo nivel</option>
          <option value="Fall (elevation)">Fall - from height / Caída de altura</option>
          <option value="Overexertion">Overexertion / Sobreesfuerzo</option>
          <option value="Repetitive motion">Repetitive motion / Movimiento repetitivo</option>
          <option value="Caught in/between">Caught in/between / Atrapado en/entre</option>
          <option value="Exposure (chemical)">Chemical exposure / Exposición química</option>
          <option value="Exposure (heat/cold)">Heat/Cold exposure / Exposición al calor/frío</option>
          <option value="Cut/Laceration">Cut/Laceration / Cortadura/Laceración</option>
          <option value="Other">Other / Otro</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-400 block">
            Description / Descripción
            <span className="ml-2 text-[#FFC107]/70 text-[10px] font-normal">
              Auto-translates Spanish to English
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechToText}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
                isListening
                  ? "bg-red-500/20 border-red-500/50 animate-pulse"
                  : "bg-[#FFC107]/20 border-[#FFC107]/50"
              }`}
              data-testid="btn-stt-description"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-red-400 tracking-wide">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#FFC107]" />
                  <span className="text-xs font-bold text-[#FFC107] tracking-wide">Speech-to-Text</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (data.description.trim()) speakSpanish(data.description);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
                data.description.trim()
                  ? "bg-[#FFC107]/20 border-[#FFC107]/50 cursor-pointer"
                  : "bg-gray-800/40 border-gray-700/50 cursor-not-allowed opacity-50"
              }`}
              data-testid="btn-tts-description"
            >
              <Volume2 className="w-4 h-4 text-[#FFC107]" />
              <span className="text-xs font-bold text-[#FFC107] tracking-wide">Text-to-Speech</span>
            </button>
          </div>
        </div>
        <Textarea
          className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
          placeholder="Escriba en español... / Type in Spanish or English..."
          value={data.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          data-testid="textarea-injury-description"
        />
        {(isTranslating || translatedDescription) && (
          <div className="mt-2 rounded-md bg-gray-800/40 border border-gray-700/50 p-3" data-testid="translation-output">
            <div className="flex items-center gap-2 mb-1">
              <Languages className="w-3.5 h-3.5 text-[#FFC107]" />
              <span className="text-[10px] uppercase tracking-wider text-[#FFC107] font-semibold">English Translation</span>
              {isTranslating && <Loader2 className="w-3 h-3 animate-spin text-[#FFC107]" data-testid="translation-loading" />}
            </div>
            <p className="text-white text-sm leading-relaxed" data-testid="translation-text">
              {isTranslating ? "Translating..." : translatedDescription}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Witnessed? / ¿Hubo testigos?</label>
        <div className="flex gap-2">
          {["Yes / Sí", "No", "Unknown / Desconocido"].map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={data.witnessed === opt ? "default" : "outline"}
              className={data.witnessed === opt
                ? "bg-[#FFC107] text-black"
                : "border-gray-600 text-gray-300"
              }
              onClick={() => setData({ ...data, witnessed: opt })}
              data-testid={`btn-witnessed-${opt.split(" ")[0].toLowerCase()}`}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-[#FFC107] text-black font-semibold"
        onClick={() => setShowSummary(true)}
        disabled={!data.employeeName || data.bodyParts.length === 0}
        data-testid="btn-generate-injury-report"
      >
        Generate Report <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

function NewHireIntakeMode() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>({
    firstName: "",
    lastName: "",
    dob: "",
    medications: "",
    surgeries: "",
    conditions: [],
    allergies: "",
    notes: "",
  });
  const [showSummary, setShowSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const conditionsList = [
    { en: "Diabetes", es: "Diabetes" },
    { en: "Hypertension", es: "Hipertensión" },
    { en: "Asthma", es: "Asma" },
    { en: "Heart Disease", es: "Enfermedad del corazón" },
    { en: "Seizures/Epilepsy", es: "Convulsiones/Epilepsia" },
    { en: "Back Problems", es: "Problemas de espalda" },
    { en: "Hearing Loss", es: "Pérdida auditiva" },
    { en: "Vision Problems", es: "Problemas de visión" },
    { en: "Sleep Apnea", es: "Apnea del sueño" },
    { en: "Anxiety/Depression", es: "Ansiedad/Depresión" },
  ];

  const toggleCondition = (c: string) => {
    setData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(c) ? prev.conditions.filter((x) => x !== c) : [...prev.conditions, c],
    }));
  };

  const steps = [
    {
      title: "Patient Info",
      titleEs: "Información del paciente",
    },
    {
      title: "Medications",
      titleEs: "Medicamentos",
    },
    {
      title: "Surgical History",
      titleEs: "Historial quirúrgico",
    },
    {
      title: "Conditions",
      titleEs: "Condiciones crónicas",
    },
  ];

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Clinical Summary - CCH</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a2e}
        h1{color:#1a1a2e;border-bottom:2px solid #FFC107;padding-bottom:8px}
        .field{margin:12px 0}.label{font-weight:bold;color:#555}.value{margin-top:4px}
        .badge{display:inline-block;background:#FFC107;color:#000;padding:2px 10px;border-radius:12px;font-size:12px;margin:2px}
        .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:16px;font-size:12px;color:#888}</style>
        </head><body>
        <h1>New Hire - Clinical Summary</h1>
        <p style="color:#888">Core Compliance Hub - Generated ${new Date().toLocaleDateString()}</p>
        <div class="field"><span class="label">Patient:</span><div class="value">${data.firstName} ${data.lastName}</div></div>
        <div class="field"><span class="label">DOB:</span><div class="value">${data.dob || "N/A"}</div></div>
        <div class="field"><span class="label">Current Medications:</span><div class="value">${data.medications || "None reported"}</div></div>
        <div class="field"><span class="label">Surgical History:</span><div class="value">${data.surgeries || "None reported"}</div></div>
        <div class="field"><span class="label">Chronic Conditions:</span><div class="value">${data.conditions.length > 0 ? data.conditions.map(c => `<span class="badge">${c}</span>`).join(" ") : "None reported"}</div></div>
        <div class="field"><span class="label">Allergies:</span><div class="value">${data.allergies || "NKDA"}</div></div>
        <div class="field"><span class="label">Additional Notes:</span><div class="value">${data.notes || "None"}</div></div>
        <div class="footer">This clinical summary was generated by Core Compliance Hub (CCH) Bilingual Medical Assistant. For clinical review only.</div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (showSummary) {
    return (
      <div ref={summaryRef} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FFC107]" />
            Clinical Summary (English)
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300" onClick={() => setShowSummary(false)} data-testid="btn-intake-back">
              <ChevronLeft className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button size="sm" className="bg-[#FFC107] text-black" onClick={handlePrint} data-testid="btn-intake-print">
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800/60 border-gray-700 p-4 space-y-3">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Patient</span>
            <p className="text-white font-medium">{data.firstName} {data.lastName}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Date of Birth</span>
            <p className="text-white font-medium">{data.dob || "N/A"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Current Medications</span>
            <p className="text-white font-medium">{data.medications || "None reported"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Surgical History</span>
            <p className="text-white font-medium">{data.surgeries || "None reported"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Chronic Conditions</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.conditions.length > 0 ? data.conditions.map((c) => (
                <Badge key={c} className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">{c}</Badge>
              )) : <span className="text-gray-500 text-sm">None reported</span>}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Allergies</span>
            <p className="text-white font-medium">{data.allergies || "NKDA"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Additional Notes</span>
            <p className="text-white font-medium">{data.notes || "None"}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">New Hire Intake</h3>
        <span className="text-sm text-gray-400">/ Admisión de nuevo empleado</span>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <button
              onClick={() => setStep(i)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i === step
                  ? "bg-[#FFC107] text-black"
                  : i < step
                  ? "bg-[#FFC107]/30 text-[#FFC107]"
                  : "bg-gray-700 text-gray-400"
              }`}
              data-testid={`btn-step-${i}`}
            >
              {i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${i < step ? "bg-[#FFC107]/50" : "bg-gray-700"}`} />
            )}
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-2">{steps[step].title}</span>
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">First Name / Nombre</label>
              <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="Nombre" value={data.firstName} onChange={(e) => setData({ ...data, firstName: e.target.value })} data-testid="input-intake-firstname" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Last Name / Apellido</label>
              <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="Apellido" value={data.lastName} onChange={(e) => setData({ ...data, lastName: e.target.value })} data-testid="input-intake-lastname" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Date of Birth / Fecha de nacimiento</label>
            <Input type="date" className="bg-gray-800/60 border-gray-700 text-white" value={data.dob} onChange={(e) => setData({ ...data, dob: e.target.value })} data-testid="input-intake-dob" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Allergies / Alergias</label>
            <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="List allergies or NKDA / Liste alergias o NKDA" value={data.allergies} onChange={(e) => setData({ ...data, allergies: e.target.value })} data-testid="input-intake-allergies" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            <span className="text-[#FFC107] font-semibold">¿Está tomando algún medicamento actualmente?</span>
            <br />
            <span className="text-gray-400 text-xs">Are you currently taking any medications?</span>
          </p>
          <Textarea
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            placeholder="List all current medications, dosages / Liste todos los medicamentos actuales y dosis"
            value={data.medications}
            onChange={(e) => setData({ ...data, medications: e.target.value })}
            data-testid="textarea-intake-medications"
          />
          <button onClick={() => speakSpanish("¿Está tomando algún medicamento actualmente? Por favor indique el nombre y la dosis.")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-medications">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            <span className="text-[#FFC107] font-semibold">¿Ha tenido alguna cirugía?</span>
            <br />
            <span className="text-gray-400 text-xs">Have you had any surgeries?</span>
          </p>
          <Textarea
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            placeholder="List all past surgeries and dates / Liste todas las cirugías pasadas y fechas"
            value={data.surgeries}
            onChange={(e) => setData({ ...data, surgeries: e.target.value })}
            data-testid="textarea-intake-surgeries"
          />
          <button onClick={() => speakSpanish("¿Ha tenido alguna cirugía? Por favor indique el tipo y la fecha.")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-surgeries">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            <span className="text-[#FFC107] font-semibold">¿Tiene alguna de las siguientes condiciones?</span>
            <br />
            <span className="text-gray-400 text-xs">Do you have any of the following conditions?</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {conditionsList.map((c) => (
              <button
                key={c.en}
                onClick={() => toggleCondition(c.en)}
                className={`p-2 rounded-md text-left text-sm border transition-all ${
                  data.conditions.includes(c.en)
                    ? "bg-[#FFC107]/20 border-[#FFC107]/50 text-[#FFC107]"
                    : "bg-gray-800/40 border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
                data-testid={`btn-condition-${c.en.toLowerCase().replace(/[\s/]+/g, "-")}`}
              >
                <span className="font-medium">{c.en}</span>
                <span className="block text-xs opacity-70">{c.es}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Additional Notes / Notas adicionales</label>
            <Textarea
              className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 min-h-[60px]"
              placeholder="Any other medical information / Otra información médica"
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              data-testid="textarea-intake-notes"
            />
          </div>
          <button onClick={() => speakSpanish("¿Tiene alguna de las siguientes condiciones? Diabetes, hipertensión, asma, enfermedad del corazón.")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-conditions">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button
          size="sm"
          variant="outline"
          className="border-gray-600 text-gray-300"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          data-testid="btn-intake-prev"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button
            size="sm"
            className="bg-[#FFC107] text-black"
            onClick={() => setStep(step + 1)}
            data-testid="btn-intake-next"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-[#FFC107] text-black"
            onClick={() => setShowSummary(true)}
            disabled={!data.firstName || !data.lastName}
            data-testid="btn-generate-summary"
          >
            <FileText className="w-4 h-4 mr-1" /> Generate Summary
          </Button>
        )}
      </div>
    </div>
  );
}

function DrugScreenMode() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">Drug Screen Instructions</h3>
        <span className="text-sm text-gray-400">/ Instrucciones de prueba de drogas</span>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-md bg-[#FFC107]/10 border border-[#FFC107]/30">
        <AlertTriangle className="w-5 h-5 text-[#FFC107] shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-[#FFC107] font-semibold">DOT / 49 CFR Part 40 Compliant</span> - These instructions follow federal drug testing procedures.
        </p>
      </div>

      <div className="space-y-3">
        {DRUG_SCREEN_STEPS.map((s) => (
          <div key={s.stepNum} className="p-3 rounded-md bg-gray-800/60 border border-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FFC107]/20 flex items-center justify-center shrink-0 text-[#FFC107] font-bold text-sm">
                {s.stepNum}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">{s.title}</span>
                  <span className="text-xs text-gray-500">/ {s.titleEs}</span>
                </div>
                <p className="text-sm text-gray-300 mb-1">{s.en}</p>
                <p className="text-xs text-[#FFC107]/80 italic">{s.es}</p>
                <button
                  onClick={() => speakSpanish(s.es)}
                  className="flex items-center gap-1 mt-2 text-xs text-[#FFC107] hover:text-[#FFC107]/80 transition-colors"
                  data-testid={`btn-speak-drug-step-${s.stepNum}`}
                >
                  <Volume2 className="w-3 h-3" /> Read in Spanish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <HandMetal className="w-4 h-4 text-[#FFC107]" />
          Quick Commands / Comandos rápidos
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { en: "Empty your pockets", es: "Vacíe sus bolsillos" },
            { en: "Do not flush", es: "No le baje al agua" },
            { en: "Remove your jacket", es: "Quítese la chaqueta" },
            { en: "Sign here please", es: "Firme aquí, por favor" },
            { en: "Wait here", es: "Espere aquí" },
            { en: "Follow me please", es: "Sígame, por favor" },
          ].map((cmd, i) => (
            <button
              key={i}
              onClick={() => speakSpanish(cmd.es)}
              className="flex items-center gap-2 p-2 rounded-md bg-gray-900/50 border border-gray-700 hover:border-[#FFC107]/40 transition-all text-left"
              data-testid={`btn-quick-cmd-${i}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-[#FFC107] shrink-0" />
              <div>
                <span className="text-xs font-medium text-[#FFC107]">{cmd.es}</span>
                <span className="text-xs text-gray-500 block">{cmd.en}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function BilingualAssistant() {
  const [mode, setMode] = useState<Mode>("intake");

  const modes = [
    { key: "injury" as Mode, label: "Injury Reporting", labelEs: "Reporte de Lesiones", icon: AlertTriangle },
    { key: "intake" as Mode, label: "New Hire Intake", labelEs: "Admisión", icon: UserPlus },
    { key: "drugscreen" as Mode, label: "Drug Screen", labelEs: "Prueba de Drogas", icon: FlaskConical },
  ];

  return (
    <section className="py-20 bg-[hsl(222,47%,11%)]" id="bilingual-assistant" data-testid="section-bilingual-assistant">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Badge className="bg-[#FFC107]/20 text-[#FFC107] mb-4 no-default-hover-elevate no-default-active-elevate">
            <Languages className="w-3 h-3 mr-1" /> CCH Exclusive
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Bilingual Medical Assistant
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            AI-powered occupational health tool with Spanish text-to-speech. Built for clinic staff serving bilingual workforces.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {modes.map((m) => (
            <Button
              key={m.key}
              variant={mode === m.key ? "default" : "outline"}
              className={mode === m.key
                ? "bg-[#FFC107] text-black"
                : "border-gray-600 text-gray-300"
              }
              onClick={() => setMode(m.key)}
              data-testid={`btn-mode-${m.key}`}
            >
              <m.icon className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.labelEs}</span>
            </Button>
          ))}
        </div>

        <Card className="bg-[hsl(222,47%,14%)] border-gray-700 p-6">
          {mode === "injury" && <InjuryReportingMode />}
          {mode === "intake" && <NewHireIntakeMode />}
          {mode === "drugscreen" && <DrugScreenMode />}

          <div className="mt-6 pt-4 border-t border-gray-700">
            <CommandCenterMode />
          </div>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-4">
          Text-to-Speech powered by browser Web Speech API. Clinical summaries are for review purposes only.
        </p>
      </div>
    </section>
  );
}