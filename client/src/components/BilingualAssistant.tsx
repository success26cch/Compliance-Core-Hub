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
  Timer,
  Thermometer,
  EyeOff,
  Wine,
  ShieldAlert,
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
    en: "The collector will check the specimen temperature within 4 minutes. The temperature must be between 90°F and 100°F (32°C-38°C).",
    es: "El recolector verificará la temperatura de la muestra dentro de 4 minutos. La temperatura debe estar entre 90°F y 100°F (32°C-38°C).",
  },
  {
    stepNum: 5,
    title: "Chain of Custody",
    titleEs: "Cadena de custodia",
    en: "You will observe the collector seal the specimen with tamper-evident tape. Initial the seal and verify all information on the Chain of Custody Form (CCF).",
    es: "Usted observará al recolector sellar la muestra con cinta a prueba de manipulaciones. Firme el sello y verifique toda la información en el formulario de Cadena de Custodia (CCF).",
  },
];

const SHY_BLADDER_STEPS = [
  {
    stepNum: 1,
    title: "Insufficient Specimen",
    titleEs: "Muestra insuficiente",
    en: "If the donor cannot provide 45mL of urine, the collector discards the insufficient specimen and documents it on the CCF.",
    es: "Si el donante no puede proporcionar 45mL de orina, el recolector descarta la muestra insuficiente y lo documenta en el formulario CCF.",
  },
  {
    stepNum: 2,
    title: "Hydration Period Begins",
    titleEs: "Comienza el período de hidratación",
    en: "The donor is given up to 40 ounces (1.18 liters) of fluid to drink over a 3-hour waiting period. The donor must remain at the collection site under observation.",
    es: "Se le da al donante hasta 40 onzas (1.18 litros) de líquido para beber durante un período de espera de 3 horas. El donante debe permanecer en el sitio de recolección bajo observación.",
  },
  {
    stepNum: 3,
    title: "Second Attempt",
    titleEs: "Segundo intento",
    en: "The donor may attempt to provide a specimen at any time during the 3-hour period. If successful (45mL+), normal collection procedures resume.",
    es: "El donante puede intentar proporcionar una muestra en cualquier momento durante el período de 3 horas. Si tiene éxito (45mL+), se reanudan los procedimientos normales de recolección.",
  },
  {
    stepNum: 4,
    title: "Failure After 3 Hours",
    titleEs: "Fallo después de 3 horas",
    en: "If the donor still cannot provide 45mL after 3 hours, the collection is stopped. The collector reports the 'shy bladder' situation to the DER (Designated Employer Representative).",
    es: "Si el donante aún no puede proporcionar 45mL después de 3 horas, se detiene la recolección. El recolector informa la situación de 'vejiga tímida' al DER (Representante Designado del Empleador).",
  },
  {
    stepNum: 5,
    title: "Medical Evaluation Required",
    titleEs: "Evaluación médica requerida",
    en: "The employer must refer the donor to a licensed physician (not the MRO) within 5 business days for a medical evaluation to determine if there is a legitimate medical reason for the inability to provide a specimen.",
    es: "El empleador debe referir al donante a un médico licenciado (no el MRO) dentro de 5 días hábiles para una evaluación médica que determine si hay una razón médica legítima para la incapacidad de proporcionar una muestra.",
  },
  {
    stepNum: 6,
    title: "Determination",
    titleEs: "Determinación",
    en: "If no legitimate medical explanation is found, the MRO reports the result as a 'Refusal to Test' - which carries the same consequences as a positive test result under DOT regulations.",
    es: "Si no se encuentra una explicación médica legítima, el MRO reporta el resultado como 'Negativa a la Prueba', lo cual conlleva las mismas consecuencias que un resultado positivo bajo las regulaciones del DOT.",
  },
];

const OUT_OF_TEMP_STEPS = [
  {
    stepNum: 1,
    title: "Temperature Check",
    titleEs: "Verificación de temperatura",
    en: "The collector must check the specimen temperature within 4 minutes of collection. The acceptable range is 90°F to 100°F (32°C to 38°C).",
    es: "El recolector debe verificar la temperatura de la muestra dentro de 4 minutos de la recolección. El rango aceptable es de 90°F a 100°F (32°C a 38°C).",
  },
  {
    stepNum: 2,
    title: "Out of Range Detected",
    titleEs: "Fuera de rango detectado",
    en: "If the specimen temperature is outside 90-100°F, this is a suspected tampering or substitution. The collector must document the out-of-range temperature on the CCF Remarks line.",
    es: "Si la temperatura de la muestra está fuera de 90-100°F, se sospecha manipulación o sustitución. El recolector debe documentar la temperatura fuera de rango en la línea de Observaciones del CCF.",
  },
  {
    stepNum: 3,
    title: "Immediate Observed Collection",
    titleEs: "Recolección observada inmediata",
    en: "The collector must immediately conduct a new, directly observed collection. The donor must provide a new specimen under direct observation by a same-gender collector.",
    es: "El recolector debe realizar inmediatamente una nueva recolección directamente observada. El donante debe proporcionar una nueva muestra bajo observación directa de un recolector del mismo género.",
  },
  {
    stepNum: 4,
    title: "Both Specimens Sent",
    titleEs: "Ambas muestras enviadas",
    en: "Both the original out-of-temperature specimen AND the new observed specimen are sent to the laboratory for testing. The lab will test both specimens.",
    es: "Tanto la muestra original fuera de temperatura COMO la nueva muestra observada se envían al laboratorio para análisis. El laboratorio analizará ambas muestras.",
  },
  {
    stepNum: 5,
    title: "Do NOT Discard",
    titleEs: "NO descarte",
    en: "CRITICAL: The original out-of-temperature specimen must NOT be discarded. It is evidence and must be sent to the lab with the CCF documenting the temperature issue.",
    es: "CRÍTICO: La muestra original fuera de temperatura NO debe descartarse. Es evidencia y debe enviarse al laboratorio con el CCF documentando el problema de temperatura.",
  },
];

const OBSERVED_COLLECTION_STEPS = [
  {
    stepNum: 1,
    title: "When Observation is Required",
    titleEs: "Cuándo se requiere observación",
    en: "Direct observation is mandatory for: Return-to-Duty (RTD) tests, Follow-Up tests, out-of-temperature specimens, suspected tampering/adulteration, and when the MRO reports an invalid result and orders a retest.",
    es: "La observación directa es obligatoria para: pruebas de Regreso al Servicio (RTD), pruebas de Seguimiento, muestras fuera de temperatura, sospecha de manipulación/adulteración, y cuando el MRO reporta un resultado inválido y ordena una nueva prueba.",
  },
  {
    stepNum: 2,
    title: "Same-Gender Observer",
    titleEs: "Observador del mismo género",
    en: "The observer MUST be the same gender as the donor. The observer can be the collector or another trained person designated by the collector.",
    es: "El observador DEBE ser del mismo género que el donante. El observador puede ser el recolector u otra persona capacitada designada por el recolector.",
  },
  {
    stepNum: 3,
    title: "Explain to the Donor",
    titleEs: "Explicar al donante",
    en: "The collector must explain the reason for the observed collection to the donor BEFORE beginning the process. The donor must be informed this is a federal requirement.",
    es: "El recolector debe explicar la razón de la recolección observada al donante ANTES de comenzar el proceso. El donante debe ser informado de que es un requisito federal.",
  },
  {
    stepNum: 4,
    title: "Observation Procedure",
    titleEs: "Procedimiento de observación",
    en: "The observer watches the donor urinate directly into the collection container. The observer must have an unobstructed view to ensure the specimen is provided by the donor and is not tampered with.",
    es: "El observador observa al donante orinar directamente en el recipiente de recolección. El observador debe tener una vista sin obstrucciones para asegurar que la muestra es proporcionada por el donante y no es manipulada.",
  },
  {
    stepNum: 5,
    title: "Refusal = Positive",
    titleEs: "Negativa = Positivo",
    en: "If the donor refuses an observed collection when it is required, this is treated as a REFUSAL TO TEST - equivalent to a positive test result with the same DOT consequences (immediate removal, SAP referral, Clearinghouse reporting).",
    es: "Si el donante se niega a una recolección observada cuando es requerida, se trata como una NEGATIVA A LA PRUEBA, equivalente a un resultado positivo con las mismas consecuencias DOT (remoción inmediata, referencia al SAP, reporte al Clearinghouse).",
  },
];

const BAT_STEPS = [
  {
    stepNum: 1,
    title: "When BAT is Required",
    titleEs: "Cuándo se requiere BAT",
    en: "Breath Alcohol Testing (BAT) is required for: Random selection, Post-Accident (within 8 hours), Reasonable Suspicion, Return-to-Duty, and Follow-Up testing. BAT uses an Evidential Breath Testing (EBT) device operated by a trained Breath Alcohol Technician.",
    es: "La Prueba de Alcohol en Aliento (BAT) es requerida para: Selección aleatoria, Post-accidente (dentro de 8 horas), Sospecha razonable, Regreso al servicio, y pruebas de Seguimiento. BAT usa un dispositivo de Prueba de Aliento Evidencial (EBT) operado por un Técnico de Alcohol en Aliento capacitado.",
  },
  {
    stepNum: 2,
    title: "Screening Test",
    titleEs: "Prueba de detección",
    en: "The first test is the Screening Test. The technician will instruct the donor to blow steadily into the mouthpiece for at least 6 seconds. If the result is less than 0.02% BAC, the test is NEGATIVE and the process is complete.",
    es: "La primera prueba es la Prueba de Detección. El técnico indicará al donante que sople de manera constante en la boquilla durante al menos 6 segundos. Si el resultado es menor de 0.02% BAC, la prueba es NEGATIVA y el proceso se completa.",
  },
  {
    stepNum: 3,
    title: "Confirmation Test",
    titleEs: "Prueba confirmatoria",
    en: "If the Screening Test result is 0.02% BAC or higher, a Confirmation Test is required. There must be a mandatory 15-minute waiting period (but no longer than 30 minutes) before the confirmation test. During this time, the donor must not eat, drink, smoke, or put anything in their mouth.",
    es: "Si el resultado de la Prueba de Detección es 0.02% BAC o mayor, se requiere una Prueba Confirmatoria. Debe haber un período de espera obligatorio de 15 minutos (pero no más de 30 minutos) antes de la prueba confirmatoria. Durante este tiempo, el donante no debe comer, beber, fumar, ni poner nada en su boca.",
  },
  {
    stepNum: 4,
    title: "Result: 0.02% - 0.039%",
    titleEs: "Resultado: 0.02% - 0.039%",
    en: "A confirmed result between 0.02% and 0.039% BAC is NOT a DOT violation, but the employee MUST be removed from safety-sensitive duties for a minimum of 24 hours. They cannot drive or perform safety-sensitive functions until their next scheduled shift (at least 24 hours later) or until a retest shows below 0.02%.",
    es: "Un resultado confirmado entre 0.02% y 0.039% BAC NO es una violación DOT, pero el empleado DEBE ser removido de funciones de seguridad por un mínimo de 24 horas. No puede conducir ni realizar funciones de seguridad hasta su próximo turno programado (al menos 24 horas después) o hasta que una nueva prueba muestre menos de 0.02%.",
  },
  {
    stepNum: 5,
    title: "Result: 0.04% or Higher",
    titleEs: "Resultado: 0.04% o mayor",
    en: "A confirmed result of 0.04% BAC or higher IS a DOT violation. The employee must be IMMEDIATELY removed from all safety-sensitive duties. The employer must report the violation to the FMCSA Clearinghouse within 3 business days. The employee must be referred to a Substance Abuse Professional (SAP) and complete the full Return-to-Duty process.",
    es: "Un resultado confirmado de 0.04% BAC o mayor ES una violación DOT. El empleado debe ser INMEDIATAMENTE removido de todas las funciones de seguridad. El empleador debe reportar la violación al Clearinghouse de FMCSA dentro de 3 días hábiles. El empleado debe ser referido a un Profesional en Abuso de Sustancias (SAP) y completar el proceso completo de Regreso al Servicio.",
  },
  {
    stepNum: 6,
    title: "BAT Quick Commands",
    titleEs: "Comandos rápidos BAT",
    en: "Do not eat, drink, or smoke for 15 minutes before the test. Blow steadily into the mouthpiece. Keep blowing until I tell you to stop. Do not burp or belch during the waiting period.",
    es: "No coma, beba ni fume durante 15 minutos antes de la prueba. Sople de manera constante en la boquilla. Siga soplando hasta que le diga que pare. No eructe durante el período de espera.",
  },
];

type DrugScreenTab = "collection" | "shybladder" | "outoftemp" | "observed" | "bat";

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
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const translateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setTranslatedText("");
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
        setTranslatedText(translation);
      }
    } catch {
      setTranslatedText("");
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
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

    let finalTranscript = spokenText;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
          setSpokenText(finalTranscript);
          if (translateTimerRef.current) clearTimeout(translateTimerRef.current);
          translateTimerRef.current = setTimeout(() => translateText(finalTranscript), 800);
        } else {
          interim = transcript;
        }
      }
      if (interim) {
        setSpokenText(finalTranscript + (finalTranscript ? " " : "") + interim);
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
  }, [isListening, spokenText, translateText]);

  useEffect(() => {
    return () => {
      if (translateTimerRef.current) clearTimeout(translateTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">Staff Command Center</h3>
        <Badge className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">
          <Volume2 className="w-3 h-3 mr-1" /> Text-to-Speech
        </Badge>
        <Badge className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">
          <Mic className="w-3 h-3 mr-1" /> Speech-to-Text
        </Badge>
      </div>
      <p className="text-sm text-gray-400">Click any button to speak the instruction in Spanish to the patient, or use the microphone to listen to the patient and see the English translation.</p>

      <div className="rounded-md bg-gray-800/40 border border-gray-700/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#FFC107]" />
            <span className="text-sm font-bold text-[#FFC107]">Patient Speech-to-Text</span>
            <span className="text-xs text-gray-400">/ Escuchar al paciente</span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
              isListening
                ? "bg-red-500/20 border-red-500/50 animate-pulse"
                : "bg-[#FFC107]/20 border-[#FFC107]/50"
            }`}
            data-testid="btn-stt-command-center"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400 tracking-wide">Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-[#FFC107]" />
                <span className="text-xs font-bold text-[#FFC107] tracking-wide">Start Listening</span>
              </>
            )}
          </button>
        </div>

        {(spokenText || isListening) && (
          <div className="space-y-2">
            <div className="rounded-md bg-gray-900/60 border border-gray-700/50 p-3">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">Spanish (what the patient said)</span>
              <p className="text-white text-sm" data-testid="stt-spanish-text">
                {spokenText || (isListening ? "Listening..." : "")}
              </p>
            </div>
            {(isTranslating || translatedText) && (
              <div className="rounded-md bg-gray-900/60 border border-[#FFC107]/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Languages className="w-3.5 h-3.5 text-[#FFC107]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#FFC107] font-semibold">English Translation</span>
                  {isTranslating && <Loader2 className="w-3 h-3 animate-spin text-[#FFC107]" />}
                </div>
                <p className="text-white text-sm" data-testid="stt-english-text">
                  {isTranslating ? "Translating..." : translatedText}
                </p>
              </div>
            )}
          </div>
        )}

        {!spokenText && !isListening && (
          <p className="text-xs text-gray-500 italic">Click "Start Listening" and let the patient speak in Spanish. Their words will appear here with an English translation.</p>
        )}
      </div>

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
          <div class="footer">This report was generated by Core Compliance Hub (CCH) Spanish Bilingual Medical Assistant. For clinical review only.</div>
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
        <div class="footer">This clinical summary was generated by Core Compliance Hub (CCH) Spanish Bilingual Medical Assistant. For clinical review only.</div>
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

function StepList({ steps, tabKey }: { steps: typeof DRUG_SCREEN_STEPS; tabKey: string }) {
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <div key={s.stepNum} className="p-3 rounded-md bg-gray-800/60 border border-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFC107]/20 flex items-center justify-center shrink-0 text-[#FFC107] font-bold text-sm">
              {s.stepNum}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-white text-sm">{s.title}</span>
                <span className="text-xs text-gray-500">/ {s.titleEs}</span>
              </div>
              <p className="text-sm text-gray-300 mb-1">{s.en}</p>
              <p className="text-xs text-[#FFC107]/80 italic">{s.es}</p>
              <button
                onClick={() => speakSpanish(s.es)}
                className="flex items-center gap-1 mt-2 text-xs text-[#FFC107] hover:text-[#FFC107]/80 transition-colors"
                data-testid={`btn-speak-${tabKey}-step-${s.stepNum}`}
              >
                <Volume2 className="w-3 h-3" /> Read in Spanish
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DrugScreenMode() {
  const [activeTab, setActiveTab] = useState<DrugScreenTab>("collection");

  const tabs: { key: DrugScreenTab; label: string; labelShort: string; icon: typeof FlaskConical; color: string }[] = [
    { key: "collection", label: "Standard Collection", labelShort: "Collection", icon: FlaskConical, color: "text-[#FFC107]" },
    { key: "shybladder", label: "Shy Bladder Process", labelShort: "Shy Bladder", icon: Timer, color: "text-orange-400" },
    { key: "outoftemp", label: "Out of Temp Range", labelShort: "Temp Range", icon: Thermometer, color: "text-red-400" },
    { key: "observed", label: "Observed Collection", labelShort: "Observed", icon: EyeOff, color: "text-purple-400" },
    { key: "bat", label: "Breath Alcohol (BAT)", labelShort: "BAT", icon: Wine, color: "text-blue-400" },
  ];

  const quickCommandsByTab: Record<DrugScreenTab, { en: string; es: string }[]> = {
    collection: [
      { en: "Empty your pockets", es: "Vacíe sus bolsillos" },
      { en: "Do not flush", es: "No le baje al agua" },
      { en: "Remove your jacket", es: "Quítese la chaqueta" },
      { en: "Sign here please", es: "Firme aquí, por favor" },
      { en: "Wait here", es: "Espere aquí" },
      { en: "Follow me please", es: "Sígame, por favor" },
    ],
    shybladder: [
      { en: "You need to drink more water", es: "Necesita tomar más agua" },
      { en: "You have 3 hours to provide a specimen", es: "Tiene 3 horas para proporcionar una muestra" },
      { en: "You cannot leave the collection site", es: "No puede salir del sitio de recolección" },
      { en: "Try again when you are ready", es: "Intente de nuevo cuando esté listo" },
      { en: "Drink slowly, up to 40 ounces", es: "Beba lentamente, hasta 40 onzas" },
      { en: "The time has expired", es: "El tiempo ha expirado" },
    ],
    outoftemp: [
      { en: "The specimen temperature is out of range", es: "La temperatura de la muestra está fuera de rango" },
      { en: "We need to collect a new specimen", es: "Necesitamos recolectar una nueva muestra" },
      { en: "This collection will be observed", es: "Esta recolección será observada" },
      { en: "This is a federal requirement", es: "Este es un requisito federal" },
      { en: "Both specimens will be sent to the lab", es: "Ambas muestras serán enviadas al laboratorio" },
      { en: "Do not discard the original specimen", es: "No descarte la muestra original" },
    ],
    observed: [
      { en: "This collection must be observed", es: "Esta recolección debe ser observada" },
      { en: "This is a federal requirement", es: "Este es un requisito federal" },
      { en: "A same-gender observer will be present", es: "Un observador del mismo género estará presente" },
      { en: "Refusing is the same as a positive test", es: "Negarse es lo mismo que un resultado positivo" },
      { en: "Do you understand the procedure?", es: "¿Entiende el procedimiento?" },
      { en: "We are ready to begin", es: "Estamos listos para comenzar" },
    ],
    bat: [
      { en: "Do not eat, drink, or smoke", es: "No coma, beba ni fume" },
      { en: "Blow steadily into the mouthpiece", es: "Sople de manera constante en la boquilla" },
      { en: "Keep blowing until I say stop", es: "Siga soplando hasta que le diga que pare" },
      { en: "Do not burp during the waiting period", es: "No eructe durante el período de espera" },
      { en: "We must wait 15 minutes", es: "Debemos esperar 15 minutos" },
      { en: "The test is complete", es: "La prueba está completa" },
    ],
  };

  const alertByTab: Record<DrugScreenTab, { title: string; desc: string }> = {
    collection: { title: "DOT / 49 CFR Part 40 Compliant", desc: "Standard urine drug screen collection procedures per federal regulations." },
    shybladder: { title: "Shy Bladder Protocol / 49 CFR 40.193", desc: "When a donor cannot provide 45mL within the initial collection attempt. 3-hour hydration window applies." },
    outoftemp: { title: "Out of Temperature Range / 49 CFR 40.65", desc: "Specimen outside 90-100°F triggers an immediate observed recollection. Both specimens go to the lab." },
    observed: { title: "Directly Observed Collection / 49 CFR 40.67", desc: "Required for RTD, Follow-Up, out-of-temp, and suspected tampering. Refusal = Positive test." },
    bat: { title: "Breath Alcohol Testing (BAT) / 49 CFR Part 40", desc: "Two-step process: Screening Test then Confirmation Test if 0.02%+ BAC. Uses Evidential Breath Testing (EBT) device." },
  };

  const stepsMap: Record<DrugScreenTab, typeof DRUG_SCREEN_STEPS> = {
    collection: DRUG_SCREEN_STEPS,
    shybladder: SHY_BLADDER_STEPS,
    outoftemp: OUT_OF_TEMP_STEPS,
    observed: OBSERVED_COLLECTION_STEPS,
    bat: BAT_STEPS,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <FlaskConical className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">Drug & Alcohol Testing</h3>
        <span className="text-sm text-gray-400">/ Pruebas de Drogas y Alcohol</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={activeTab === t.key ? "default" : "outline"}
            className={activeTab === t.key
              ? "bg-[#FFC107] text-black"
              : "border-gray-600 text-gray-300"
            }
            onClick={() => setActiveTab(t.key)}
            data-testid={`btn-drug-tab-${t.key}`}
          >
            <t.icon className={`w-4 h-4 mr-1 ${activeTab === t.key ? "text-black" : t.color}`} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.labelShort}</span>
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-md bg-[#FFC107]/10 border border-[#FFC107]/30">
        <ShieldAlert className="w-5 h-5 text-[#FFC107] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-[#FFC107] font-semibold">{alertByTab[activeTab].title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{alertByTab[activeTab].desc}</p>
        </div>
      </div>

      <StepList steps={stepsMap[activeTab]} tabKey={activeTab} />

      <Card className="bg-gray-800/60 border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <HandMetal className="w-4 h-4 text-[#FFC107]" />
          Quick Commands / Comandos rápidos
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickCommandsByTab[activeTab].map((cmd, i) => (
            <button
              key={i}
              onClick={() => speakSpanish(cmd.es)}
              className="flex items-center gap-2 p-2 rounded-md bg-gray-900/50 border border-gray-700 hover:border-[#FFC107]/40 transition-all text-left"
              data-testid={`btn-quick-cmd-${activeTab}-${i}`}
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

interface BilingualAssistantProps {
  prefilledName?: string;
  prefilledCompany?: string;
}

export default function BilingualAssistant({ prefilledName, prefilledCompany }: BilingualAssistantProps = {}) {
  const [mode, setMode] = useState<Mode>("intake");

  const modes = [
    { key: "injury" as Mode, label: "Injury Reporting", labelEs: "Reporte de Lesiones", icon: AlertTriangle },
    { key: "intake" as Mode, label: "New Hire Intake", labelEs: "Admisión", icon: UserPlus },
    { key: "drugscreen" as Mode, label: "Drug Screen", labelEs: "Prueba de Drogas", icon: FlaskConical },
  ];

  return (
    <section className="py-20 bg-[hsl(222,47%,11%)]" id="bilingual-assistant" data-testid="section-bilingual-assistant">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {prefilledName && (
          <div className="mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-center">
            <p className="text-sm text-green-400">
              <span className="font-bold">Passport Active:</span> {prefilledName}
              {prefilledCompany && <span className="text-green-400/70"> | {prefilledCompany}</span>}
            </p>
          </div>
        )}
        <div className="text-center mb-8">
          <Badge className="bg-[#FFC107]/20 text-[#FFC107] mb-4 no-default-hover-elevate no-default-active-elevate">
            <Languages className="w-3 h-3 mr-1" /> CCH Exclusive
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Spanish Bilingual Medical Assistant
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