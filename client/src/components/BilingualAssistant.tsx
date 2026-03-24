import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock, Unlock, CheckCircle2, ArrowRight, Star } from "lucide-react";

const BMA_GATE_KEY = "bma_gate_v1";

function getBmaGateState(): { triedModes: string[]; unlocked: boolean } {
  try {
    const s = localStorage.getItem(BMA_GATE_KEY);
    return s ? JSON.parse(s) : { triedModes: [], unlocked: false };
  } catch {
    return { triedModes: [], unlocked: false };
  }
}

function saveBmaGateState(state: { triedModes: string[]; unlocked: boolean }) {
  try { localStorage.setItem(BMA_GATE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function BmaLeadGate({ onUnlock }: { onUnlock: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", company: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) {
      setError("First name and email are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await fetch("/api/bma-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch { /* fire-and-forget */ }
    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => onUnlock(), 1800);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg" style={{ backdropFilter: "blur(8px)", background: "rgba(15,22,40,0.88)" }}>
      <div className="w-full max-w-md mx-4">
        {submitted ? (
          <div className="text-center space-y-3 py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">You're in!</h3>
            <p className="text-gray-300 text-sm">Unlocking your full access now…</p>
          </div>
        ) : (
          <div className="bg-[hsl(222,47%,16%)] border border-[#FFC107]/40 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FFC107]/20 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-[#FFC107]" />
              </div>
              <h3 className="text-xl font-bold text-white">You've tried all 3 visit types!</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Enter your info to unlock continued access. We'll also send you a quick product overview — no spam, ever.
              </p>
              <div className="flex justify-center gap-4 pt-1">
                <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> Injury Reporting</span>
                <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> New Hire Intake</span>
                <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> Drug Screen</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">First Name *</label>
                  <Input
                    className="bg-gray-900/60 border-gray-600 text-white placeholder:text-gray-500 text-sm"
                    placeholder="Jane"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    data-testid="input-gate-firstname"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Last Name</label>
                  <Input
                    className="bg-gray-900/60 border-gray-600 text-white placeholder:text-gray-500 text-sm"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    data-testid="input-gate-lastname"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Company / Clinic</label>
                <Input
                  className="bg-gray-900/60 border-gray-600 text-white placeholder:text-gray-500 text-sm"
                  placeholder="Acme Occupational Health"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  data-testid="input-gate-company"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Work Email *</label>
                <Input
                  type="email"
                  className="bg-gray-900/60 border-gray-600 text-white placeholder:text-gray-500 text-sm"
                  placeholder="jane@yourcompany.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="input-gate-email"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-[#FFC107] text-black font-bold hover:bg-[#FFD54F]"
                disabled={isSubmitting}
                data-testid="btn-gate-submit"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Unlocking…" : "Unlock Full Access"}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              <p className="text-center text-xs text-gray-500">
                No credit card required. We'll reach out about pricing when you're ready.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
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
  Send,
  MessageCircle,
  Trash2,
  User,
  Bot,
  HardHat,
  Phone,
  Briefcase,
  Activity,
  UserCheck,
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
      { en: "Do you wear glasses?", es: "¿Usa lentes (gafas)?" },
      { en: "Do you have your glasses with you?", es: "¿Tiene sus lentes con usted?" },
      { en: "Please put your glasses on if you need them to see.", es: "Por favor, póngase los lentes si los necesita para ver." },
      { en: "Do you wear contact lenses?", es: "¿Usa lentes de contacto?" },
      { en: "Are you wearing your contacts right now?", es: "¿Está usando sus lentes de contacto en este momento?" },
      { en: "Read the smallest line you can see clearly.", es: "Lea la línea más pequeña que pueda ver con claridad." },
      { en: "Cover your left eye with your hand — do not press on the eye.", es: "Cúbrase el ojo izquierdo con la mano — no presione el ojo." },
      { en: "Cover your right eye with your hand — do not press on the eye.", es: "Cúbrase el ojo derecho con la mano — no presione el ojo." },
      { en: "What colors do you see on the chart?", es: "¿Qué colores ve en el cuadro?" },
      { en: "Can you tell me what number you see in the circle?", es: "¿Puede decirme qué número ve dentro del círculo?" },
      { en: "For the peripheral test — please stare directly at my nose and do not move your eyes.", es: "Para la prueba de visión periférica — por favor mire directamente mi nariz y no mueva los ojos." },
      { en: "Tell me as soon as you see my finger move.", es: "Dígame en cuanto vea que muevo el dedo." },
      { en: "Do you see my finger on this side?", es: "¿Ve mi dedo de este lado?" },
      { en: "Do you have any blurry vision or double vision?", es: "¿Tiene visión borrosa o visión doble?" },
      { en: "Have you had any recent changes in your vision?", es: "¿Ha tenido cambios recientes en su visión?" },
    ],
  },
  {
    category: "Physical Exam",
    icon: Stethoscope,
    commands: [
      { en: "Do you currently take any medications?", es: "¿Actualmente toma algún medicamento?" },
      { en: "Please list all medications, including vitamins and supplements.", es: "Por favor, liste todos sus medicamentos, incluyendo vitaminas y suplementos." },
      { en: "Have you ever had any surgeries?", es: "¿Ha tenido alguna cirugía?" },
      { en: "Do you have any heart problems or heart disease?", es: "¿Tiene algún problema cardíaco o enfermedad del corazón?" },
      { en: "Have you ever had a heart attack or stroke?", es: "¿Ha tenido alguna vez un ataque al corazón o un derrame cerebral?" },
      { en: "Do you have high blood pressure?", es: "¿Tiene la presión arterial alta?" },
      { en: "Do you have diabetes?", es: "¿Tiene diabetes?" },
      { en: "Have you ever had seizures or epilepsy?", es: "¿Ha tenido convulsiones o epilepsia alguna vez?" },
      { en: "Do you have any breathing problems such as asthma or COPD?", es: "¿Tiene problemas para respirar, como asma o EPOC?" },
      { en: "Are you currently pregnant?", es: "¿Está embarazada actualmente?" },
      { en: "Do you have any allergies to medications?", es: "¿Tiene alguna alergia a medicamentos?" },
      { en: "Take a deep breath and hold it.", es: "Respire profundo y manténgalo." },
      { en: "Breathe normally.", es: "Respire normalmente." },
      { en: "Raise both arms above your head.", es: "Levante ambos brazos por encima de la cabeza." },
      { en: "Squeeze my hands as hard as you can.", es: "Apriete mis manos tan fuerte como pueda." },
      { en: "Stand up straight and look forward.", es: "Párese derecho y mire al frente." },
    ],
  },
  {
    category: "Drug Screen",
    icon: FlaskConical,
    commands: [
      { en: "Hi, my name is ___ and I will be your collector today.", es: "Hola, mi nombre es ___ y seré su recolector(a) hoy." },
      { en: "Please remove your jacket and empty your pockets.", es: "Por favor, quítese la chaqueta y vacíe sus bolsillos." },
      { en: "Please place your things right here.", es: "Por favor, coloque sus cosas aquí." },
      { en: "You must provide a minimum of 45 milliliters.", es: "Debe proporcionar un mínimo de 45 mililitros." },
      { en: "Do not flush the toilet or turn on the faucet.", es: "No le baje al agua al inodoro ni abra el grifo." },
      { en: "When you are done, please bring the cup directly to me.", es: "Cuando termine, tráigame el vaso directamente a mí." },
      { en: "Now you can wash your hands.", es: "Ahora puede lavarse las manos." },
      { en: "I need you to put your initials right here.", es: "Necesito que ponga sus iniciales aquí." },
      { en: "Now I need you to sign right here.", es: "Ahora necesito que firme aquí." },
      { en: "You can collect your things now.", es: "Ahora puede recoger sus cosas." },
      { en: "Your sample will be sent to the lab overnight. Results will be sent to your employer within 24 to 48 hours.", es: "Su muestra será enviada al laboratorio esta noche. Los resultados serán enviados a su empleador en 24 a 48 horas." },
      { en: "Thank you and have a nice day.", es: "Gracias y que tenga un buen día." },
    ],
  },
  {
    category: "Breathing / PFT",
    icon: Wind,
    commands: [
      { en: "Blow as hard and as long as you can — do not stop blowing until I tell you to.", es: "Sople tan fuerte y por tanto tiempo como pueda — no deje de soplar hasta que yo le diga." },
      { en: "Seal your lips tightly around the mouthpiece — no air should escape.", es: "Selle los labios firmemente alrededor de la boquilla — no debe escaparse el aire." },
      { en: "Breathe in as deeply as possible, then blow out fast and hard.", es: "Inhale lo más profundo que pueda, luego exhale rápido y fuerte." },
      { en: "I need 3 good tests, so we have to do another one.", es: "Necesito 3 pruebas buenas, así que tenemos que hacer otra." },
      { en: "Ok, you are all set. We will send the results to your employer.", es: "Listo, ya terminamos. Le enviaremos los resultados a su empleador." },
    ],
  },
  {
    category: "Blood Draw / TB Test",
    icon: Droplets,
    commands: [
      { en: "Make a fist.", es: "Cierre el puño." },
      { en: "Are you allergic to latex?", es: "¿Es alérgico(a) al látex?" },
      { en: "Have you eaten today?", es: "¿Ha comido hoy?" },
      { en: "You may feel a small pinch.", es: "Puede sentir un pequeño pinchazo." },
      { en: "— TB Test —", es: "— Prueba de TB —" },
      { en: "Have you ever had a TB test before?", es: "¿Alguna vez le han hecho una prueba de tuberculosis?" },
      { en: "Have you ever tested positive for tuberculosis?", es: "¿Alguna vez ha salido positivo en una prueba de tuberculosis?" },
      { en: "Have you ever had an allergic reaction to the TB test?", es: "¿Ha tenido alguna vez una reacción alérgica a la prueba de tuberculosis?" },
      { en: "Which arm would you like the test in?", es: "¿En cuál brazo quiere la prueba?" },
      { en: "Ok, small poke.", es: "Listo, pequeño piquete." },
      { en: "Do not wrap it or put a bandage on it.", es: "No lo envuelva ni le ponga vendaje." },
      { en: "You must come back in 48 to 72 hours so we can read your arm.", es: "Debe regresar en 48 a 72 horas para que podamos leer su brazo." },
      { en: "You are all set — we will see you back in 48 to 72 hours. Don't forget!", es: "¡Listo! Lo esperamos de regreso en 48 a 72 horas. ¡No lo olvide!" },
    ],
  },
  {
    category: "Breath Alcohol Test",
    icon: Wind,
    commands: [
      { en: "Hi, my name is ___ and I will be administering your breath alcohol test today.", es: "Hola, mi nombre es ___ y seré quien le administre la prueba de alcohol en aliento hoy." },
      { en: "I need you to blow into this tube.", es: "Necesito que sople dentro de este tubo." },
      { en: "Take a deep breath and blow nice and steady until I tell you to stop.", es: "Tome una respiración profunda y sople de manera uniforme hasta que yo le diga que pare." },
      { en: "I need your signature right here.", es: "Necesito su firma aquí." },
      { en: "— If Positive —", es: "— Si es Positivo —" },
      { en: "I need you to have a seat — you must stay here in the clinic.", es: "Necesito que tome asiento — debe permanecer aquí en la clínica." },
      { en: "After 15 minutes we are going to test you again.", es: "Después de 15 minutos le vamos a hacer la prueba otra vez." },
      { en: "The result is still positive. We are going to have to contact the company, and they will need to arrange a ride for you.", es: "El resultado sigue siendo positivo. Vamos a tener que contactar a la empresa y ellos deberán proporcionarle un transporte." },
      { en: "I will send the results directly to the company.", es: "Enviaré los resultados directamente a la empresa." },
      { en: "Thank you for coming in and have a nice day.", es: "Gracias por venir y que tenga un buen día." },
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
  jobTitle: string;
  department: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medications: string;
  surgeries: string;
  conditions: string[];
  allergies: string;
  hearingProtectionHistory: string;
  ppeRequired: string[];
  priorWorkersComp: string;
  notes: string;
}

interface InjuryData {
  employeeName: string;
  dateOfInjury: string;
  timeOfInjury: string;
  supervisorName: string;
  jobTitle: string;
  bodyParts: string[];
  description: string;
  mechanism: string;
  witnessed: string;
  ppeWorn: string[];
  treatmentType: string;
  firstAidDetails: string;
  sentToClinic: string;
}

let _currentAudio: HTMLAudioElement | null = null;

function stopAllAudio() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
}

function cleanTextForTTS(text: string): string {
  return text
    .replace(/[→←↑↓►◄▶◀"""\\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function safeStopRecognition(ref: React.MutableRefObject<any>) {
  if (ref.current) {
    try { ref.current.stop(); } catch { /* already stopped */ }
    ref.current = null;
  }
}

function createRecognition(lang: string, continuous: boolean) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.lang = lang;
  r.continuous = continuous;
  r.interimResults = true;
  r.maxAlternatives = 1;
  return r;
}

async function playSpanishAudio(text: string) {
  stopAllAudio();
  const clean = cleanTextForTTS(text);
  if (!clean) return;
  try {
    const res = await fetch("/api/bma-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean }),
    });
    if (!res.ok) throw new Error("TTS failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (_currentAudio === audio) _currentAudio = null;
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (_currentAudio === audio) _currentAudio = null;
    };
    audio.play();
  } catch {
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "es-MX";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}

function StopReadingButton() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const webSpeaking = window.speechSynthesis?.speaking ?? false;
      const audioPlaying = _currentAudio !== null && !_currentAudio.paused;
      setActive(webSpeaking || audioPlaying);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  if (!active) return null;

  return (
    <button
      type="button"
      onClick={stopAllAudio}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-red-500/20 border-red-500/50 animate-pulse transition-colors hover:bg-red-500/30"
      data-testid="btn-stop-reading"
    >
      <VolumeX className="w-4 h-4 text-red-400" />
      <span className="text-xs font-bold text-red-400 tracking-wide">Stop Reading</span>
    </button>
  );
}

function speakEnglish(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^\s*[-*]\s+/gm, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferred = enVoices.find(v => v.name.includes('Samantha') || v.name.includes('Google US') || v.name.includes('Microsoft Jenny'))
      || enVoices.find(v => v.name.includes('Natural') || v.name.includes('Neural'))
      || enVoices[0];
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }
}

interface BmaChatMessage {
  role: "user" | "assistant";
  content: string;
  speaker?: "provider" | "patient";
  spanish?: string;
}

const BMA_CONTEXT_OPTIONS = [
  { value: "dot-physical", label: "DOT Physical" },
  { value: "injury-report", label: "Injury Reporting" },
  { value: "work-restrictions", label: "Work Restrictions" },
  { value: "blood-draw", label: "Blood Draw / Lab Work" },
  { value: "general", label: "General Medical Visit" },
];

const CONTEXT_STARTERS: Record<string, { label: string; prompt: string }[]> = {
  "dot-physical": [
    { label: "Introduce exam", prompt: "I am going to perform your DOT physical examination today. I need to check your vision, hearing, blood pressure, and overall health." },
    { label: "Medical history", prompt: "I need to review your medical history. Have you ever been diagnosed with diabetes, high blood pressure, heart disease, or seizures?" },
    { label: "Medications", prompt: "Please list all medications you are currently taking, including over-the-counter medications and supplements." },
    { label: "Vision test", prompt: "I need to test your vision. Please read the smallest line you can see on the chart." },
    { label: "Blood pressure", prompt: "I am going to take your blood pressure. Please relax your arm and stay still." },
    { label: "Exam result", prompt: "Based on today's examination, you meet the medical standards required for commercial motor vehicle driving." },
  ],
  "injury-report": [
    { label: "Open visit", prompt: "Tell me what happened. Can you describe where you were and what you were doing when you got hurt?" },
    { label: "Pain location", prompt: "Point to where you feel pain. On a scale of 1 to 10, how would you rate your pain right now?" },
    { label: "PPE question", prompt: "Were you wearing any personal protective equipment at the time of the injury, such as gloves, a hard hat, or safety shoes?" },
    { label: "Treatment plan", prompt: "We are going to clean and bandage the wound. I want you to come back in two days so we can check how it is healing." },
    { label: "Work restrictions", prompt: "Based on your injury, I am recommending that you avoid lifting more than 10 pounds for the next three days." },
  ],
  "work-restrictions": [
    { label: "Explain restrictions", prompt: "Based on your evaluation, I am placing you on light duty. This means you cannot lift more than 15 pounds or stand for more than 2 hours at a time." },
    { label: "Duration", prompt: "These restrictions will be in place for the next two weeks. We will reassess at your follow-up appointment." },
    { label: "RTW instructions", prompt: "You are cleared to return to work with restrictions. Please give this form to your supervisor before starting your shift." },
    { label: "Full release", prompt: "I am clearing you to return to full duty with no restrictions as of today." },
    { label: "Employer communication", prompt: "A copy of your work restrictions will be sent to your employer's HR department and to the occupational health coordinator." },
  ],
  "blood-draw": [
    { label: "Explain procedure", prompt: "I am going to draw a small amount of blood from your arm for lab testing. You may feel a small pinch when I insert the needle." },
    { label: "Consent", prompt: "This blood draw is required for your occupational health evaluation. Do you have any questions before we begin?" },
    { label: "Allergy check", prompt: "Are you allergic to latex or adhesives? Have you ever fainted or felt dizzy during a blood draw?" },
    { label: "During draw", prompt: "Please keep your arm still and look away if you need to. It will only take about 30 seconds." },
    { label: "After draw", prompt: "Apply pressure to this area for a few minutes. Do not do any heavy lifting with this arm for the rest of the day." },
  ],
  "general": [
    { label: "Open exam", prompt: "Good morning. My name is the medical assistant. I am here to help with your visit today. What brings you in?" },
    { label: "Medical history", prompt: "I need to ask you a few questions about your health history before the provider sees you." },
    { label: "Symptoms", prompt: "When did you start feeling this way? Do you have any fever, chills, nausea, or shortness of breath?" },
    { label: "Medications", prompt: "Are you currently taking any prescription medications, vitamins, or supplements?" },
    { label: "Follow-up care", prompt: "The provider wants to see you again in one week. Please call us if your symptoms get worse before then." },
  ],
};

function BmaInteractiveChatMode() {
  const [messages, setMessages] = useState<BmaChatMessage[]>([]);
  const [providerInput, setProviderInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<"provider" | "patient">("provider");
  const [context, setContext] = useState("general");
  const [isListening, setIsListening] = useState(false);
  const [isProviderListening, setIsProviderListening] = useState(false);
  const [patientSpoken, setPatientSpoken] = useState("");
  const recognitionRef = useRef<any>(null);
  const providerRecognitionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(async (text: string, speaker: "provider" | "patient") => {
    if (!text.trim() || isLoading) return;

    const prefix = speaker === "provider"
      ? `[PROVIDER says in English]: ${text}`
      : `[PATIENT says in Spanish]: ${text}`;

    const userMsg: BmaChatMessage = { role: "user", content: prefix, speaker };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setProviderInput("");
    setPatientSpoken("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/bma-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: BMA_CONTEXT_OPTIONS.find(c => c.value === context)?.label || "General Medical Visit",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: BmaChatMessage = {
          role: "assistant",
          content: data.reply || data.spanish || data.english || "",
          spanish: data.spanish || "",
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (speaker === "provider" && data.spanish) {
          playSpanishAudio(data.spanish);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, context]);

  const togglePatientListening = useCallback(() => {
    if (isListening) {
      safeStopRecognition(recognitionRef);
      setIsListening(false);
      return;
    }

    const recognition = createRecognition("es-MX", true);
    if (!recognition) return;
    recognitionRef.current = recognition;

    let finalTranscript = patientSpoken;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
          setPatientSpoken(finalTranscript);
        } else {
          interim = transcript;
        }
      }
      if (interim) {
        setPatientSpoken(finalTranscript + (finalTranscript ? " " : "") + interim);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      const ignorable = ["no-speech", "aborted"];
      if (!ignorable.includes(event.error)) {
        console.warn("Speech recognition error:", event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      recognitionRef.current = null;
    }
  }, [isListening, patientSpoken]);

  const toggleProviderListening = useCallback(() => {
    if (isProviderListening) {
      safeStopRecognition(providerRecognitionRef);
      setIsProviderListening(false);
      return;
    }

    const recognition = createRecognition("en-US", true);
    if (!recognition) return;
    providerRecognitionRef.current = recognition;

    let finalTranscript = providerInput;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
          setProviderInput(finalTranscript);
        } else {
          interim = transcript;
        }
      }
      if (interim) {
        setProviderInput(finalTranscript + (finalTranscript ? " " : "") + interim);
      }
    };

    recognition.onend = () => {
      setIsProviderListening(false);
      providerRecognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      const ignorable = ["no-speech", "aborted"];
      if (!ignorable.includes(event.error)) {
        console.warn("Provider speech recognition error:", event.error);
      }
      setIsProviderListening(false);
      providerRecognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsProviderListening(true);
    } catch (err) {
      console.warn("Could not start provider speech recognition:", err);
      providerRecognitionRef.current = null;
    }
  }, [isProviderListening, providerInput]);

  useEffect(() => {
    return () => {
      safeStopRecognition(recognitionRef);
      safeStopRecognition(providerRecognitionRef);
    };
  }, []);

  const clearChat = () => {
    setMessages([]);
    setProviderInput("");
    setPatientSpoken("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#FFC107]" />
          <h3 className="text-lg font-bold text-white">AI Medical Interpreter</h3>
          <Badge className="bg-green-500/20 text-green-400 no-default-hover-elevate no-default-active-elevate">
            <Bot className="w-3 h-3 mr-1" /> AI-Powered
          </Badge>
        </div>
        {messages.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
            onClick={clearChat}
            data-testid="btn-bma-clear-chat"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>
      <p className="text-sm text-gray-100">
        Real-time bidirectional interpretation between provider and patient. The AI translates with clinical precision, confirms understanding, and generates summaries for the medical record.
      </p>

      <div className="flex flex-wrap gap-2 mb-2">
        <span className="text-xs text-gray-100 self-center">Visit Type:</span>
        {BMA_CONTEXT_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            size="sm"
            variant={context === opt.value ? "default" : "outline"}
            className={context === opt.value
              ? "bg-[#FFC107] text-black"
              : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
            }
            onClick={() => setContext(opt.value)}
            data-testid={`btn-bma-context-${opt.value}`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {CONTEXT_STARTERS[context] && (
        <div className="rounded-md bg-gray-900/40 border border-gray-700/40 p-3 space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Quick starters — {BMA_CONTEXT_OPTIONS.find(o => o.value === context)?.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_STARTERS[context].map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.prompt, "provider")}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-[#F57C00]/20 border border-[#F57C00]/40 text-[#FFC107] hover:bg-[#F57C00]/40 transition-colors disabled:opacity-40"
                data-testid={`btn-starter-${context}-${i}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">Click any starter to send a pre-written English phrase — the AI translates it to Spanish and reads it aloud.</p>
        </div>
      )}

      <div ref={chatContainerRef} className="rounded-md bg-gray-900/60 border border-gray-700/50 p-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3" data-testid="bma-chat-messages">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation. Type what the provider says in English, or use a quick starter above.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "assistant" ? "" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === "assistant"
                ? "bg-[#FFC107]/20"
                : msg.speaker === "provider"
                  ? "bg-blue-500/20"
                  : "bg-green-500/20"
            }`}>
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-[#FFC107]" />
              ) : msg.speaker === "provider" ? (
                <Stethoscope className="w-4 h-4 text-blue-400" />
              ) : (
                <User className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {msg.role !== "assistant" && (
                <span className={`text-[10px] uppercase tracking-wider font-semibold block mb-1 ${
                  msg.speaker === "provider" ? "text-blue-400" : "text-green-400"
                }`}>
                  {msg.speaker === "provider" ? "Provider" : "Patient"}
                </span>
              )}
              {msg.role === "assistant" ? (
                <div className="text-sm text-white whitespace-pre-wrap leading-relaxed" data-testid={`bma-chat-response-${i}`}>
                  {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, pi) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <span key={pi} className="font-bold text-[#FFC107]">{part.slice(2, -2)}</span>;
                    }
                    return <span key={pi}>{part}</span>;
                  })}
                </div>
              ) : (
                <p className="text-sm text-white" data-testid={`bma-chat-input-${i}`}>
                  {msg.content.replace(/^\[(PROVIDER|PATIENT) says in (English|Spanish)\]: /, "")}
                </p>
              )}
            </div>
            {msg.role === "assistant" && (
              <div className="flex flex-col gap-1 self-start mt-1">
                <button
                  type="button"
                  onClick={() => speakEnglish(msg.content)}
                  className="p-1.5 rounded-md bg-gray-800/60 border border-blue-500/30 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
                  title="Listen in English"
                  data-testid={`btn-bma-listen-en-${i}`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] text-blue-400 font-semibold">EN</span>
                </button>
                {msg.spanish && (
                  <button
                    type="button"
                    onClick={() => playSpanishAudio(msg.spanish!)}
                    className="p-1.5 rounded-md bg-gray-800/60 border border-[#FFC107]/30 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
                    title="Listen in Spanish"
                    data-testid={`btn-bma-listen-es-${i}`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#FFC107]" />
                    <span className="text-[10px] text-[#FFC107] font-semibold">ES</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 items-center">
            <div className="w-7 h-7 rounded-full bg-[#FFC107]/20 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-[#FFC107] animate-spin" />
            </div>
            <p className="text-sm text-gray-100">Translating and analyzing...</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          variant={activeSpeaker === "provider" ? "default" : "outline"}
          className={activeSpeaker === "provider"
            ? "bg-blue-600 text-white"
            : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
          }
          onClick={() => setActiveSpeaker("provider")}
          data-testid="btn-bma-speaker-provider"
        >
          <Stethoscope className="w-4 h-4 mr-1" /> Provider (English)
        </Button>
        <Button
          size="sm"
          variant={activeSpeaker === "patient" ? "default" : "outline"}
          className={activeSpeaker === "patient"
            ? "bg-green-600 text-white"
            : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
          }
          onClick={() => setActiveSpeaker("patient")}
          data-testid="btn-bma-speaker-patient"
        >
          <User className="w-4 h-4 mr-1" /> Patient (Spanish)
        </Button>
      </div>

      {activeSpeaker === "provider" ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleProviderListening}
            className={`flex items-center justify-center w-9 shrink-0 rounded-md border transition-colors ${
              isProviderListening
                ? "bg-red-500/20 border-red-500/50 animate-pulse"
                : "bg-blue-500/20 border-blue-500/50"
            }`}
            title={isProviderListening ? "Stop listening" : "Speak in English"}
            data-testid="btn-bma-provider-mic"
          >
            {isProviderListening ? (
              <MicOff className="w-4 h-4 text-red-400" />
            ) : (
              <Mic className="w-4 h-4 text-blue-400" />
            )}
          </button>
          <Input
            value={providerInput}
            onChange={(e) => setProviderInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(providerInput, "provider"); } }}
            placeholder={isProviderListening ? "Listening..." : "Type or speak what the provider says in English..."}
            className={`flex-1 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 ${isProviderListening ? "ring-2 ring-blue-500/50" : ""}`}
            disabled={isLoading}
            data-testid="input-bma-provider"
          />
          <Button
            size="icon"
            variant="default"
            className="bg-blue-600"
            onClick={() => sendMessage(providerInput, "provider")}
            disabled={!providerInput.trim() || isLoading}
            data-testid="btn-bma-send-provider"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={togglePatientListening}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md border transition-colors ${
                isListening
                  ? "bg-red-500/20 border-red-500/50 animate-pulse"
                  : "bg-green-500/20 border-green-500/50"
              }`}
              data-testid="btn-bma-patient-mic"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-red-400">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold text-green-400">Record Patient</span>
                </>
              )}
            </button>
            <span className="text-xs text-gray-500">
              {isListening ? "Listening for Spanish..." : "Press to record patient speaking Spanish"}
            </span>
          </div>
          {patientSpoken && (
            <div className="flex gap-2">
              <div className="flex-1 rounded-md bg-gray-800/60 border border-green-500/30 p-2">
                <span className="text-[10px] uppercase tracking-wider text-green-400 font-semibold block mb-1">Patient said (Spanish)</span>
                <p className="text-sm text-white" data-testid="bma-patient-spoken">{patientSpoken}</p>
              </div>
              <Button
                size="icon"
                variant="default"
                className="bg-green-600 self-end"
                onClick={() => sendMessage(patientSpoken, "patient")}
                disabled={isLoading}
                data-testid="btn-bma-send-patient"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
    if (isListening) {
      safeStopRecognition(recognitionRef);
      setIsListening(false);
      return;
    }

    const recognition = createRecognition("es-MX", true);
    if (!recognition) return;
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

    recognition.onerror = (event: any) => {
      const ignorable = ["no-speech", "aborted"];
      if (!ignorable.includes(event.error)) {
        console.warn("Speech recognition error:", event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      recognitionRef.current = null;
    }
  }, [isListening, spokenText, translateText]);

  useEffect(() => {
    return () => {
      if (translateTimerRef.current) clearTimeout(translateTimerRef.current);
      safeStopRecognition(recognitionRef);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Languages className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">Staff Command Center</h3>
        <Badge className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">
          <Volume2 className="w-3 h-3 mr-1" /> Text-to-Speech
        </Badge>
        <Badge className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">
          <Mic className="w-3 h-3 mr-1" /> Speech-to-Text
        </Badge>
        <StopReadingButton />
      </div>
      <p className="text-sm text-gray-100">Click any button to speak the instruction in Spanish to the patient, or use the microphone to listen to the patient and see the English translation.</p>

      <div className="rounded-md bg-gray-800/40 border border-gray-700/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#FFC107]" />
            <span className="text-sm font-bold text-[#FFC107]">Patient Speech-to-Text</span>
            <span className="text-xs text-gray-100">/ Escuchar al paciente</span>
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
              <span className="text-[10px] uppercase tracking-wider text-gray-100 font-semibold block mb-1">Spanish (what the patient said)</span>
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
              : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
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
            onClick={() => playSpanishAudio(cmd.es)}
            className="flex items-start gap-3 p-3 rounded-md bg-gray-800/60 border border-[#FFC107]/50 hover:bg-gray-800 transition-all text-left group"
            data-testid={`btn-speak-${activeCategory}-${j}`}
          >
            <div className="mt-0.5 w-8 h-8 rounded-full bg-[#FFC107]/30 flex items-center justify-center shrink-0 group-hover:bg-[#FFC107]/40 transition-colors">
              <Volume2 className="w-4 h-4 text-[#FFC107]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{cmd.en}</p>
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
    timeOfInjury: "",
    supervisorName: "",
    jobTitle: "",
    bodyParts: [],
    description: "",
    mechanism: "",
    witnessed: "",
    ppeWorn: [],
    treatmentType: "",
    firstAidDetails: "",
    sentToClinic: "",
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
    if (isListening) {
      safeStopRecognition(recognitionRef);
      setIsListening(false);
      return;
    }

    const recognition = createRecognition("es-MX", true);
    if (!recognition) return;
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

    recognition.onerror = (event: any) => {
      const ignorable = ["no-speech", "aborted"];
      if (!ignorable.includes(event.error)) {
        console.warn("Injury report speech recognition error:", event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      recognitionRef.current = null;
    }
  }, [isListening, data.description, handleDescriptionChange]);

  useEffect(() => {
    return () => {
      if (translateTimerRef.current) clearTimeout(translateTimerRef.current);
      safeStopRecognition(recognitionRef);
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
          <html><head><title>Injury Report - CCHUB</title>
          <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a2e}
          h1{color:#1a1a2e;border-bottom:2px solid #FFC107;padding-bottom:8px}
          h2{color:#444;font-size:14px;margin-top:24px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #eee;padding-bottom:4px}
          .field{margin:10px 0}.label{font-weight:bold;color:#555;font-size:13px}.value{margin-top:3px;font-size:14px}
          .badge{display:inline-block;background:#FFF3CD;color:#000;padding:2px 10px;border-radius:12px;font-size:12px;margin:2px;border:1px solid #FFC107}
          .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:16px;font-size:12px;color:#888}</style>
          </head><body>
          <h1>Workplace Injury Report</h1>
          <p style="color:#888;font-size:13px">Core Compliance Hub — Generated ${new Date().toLocaleString()}</p>
          <h2>Employee Information</h2>
          <div class="field"><span class="label">Employee Name:</span><div class="value">${data.employeeName || "N/A"}</div></div>
          <div class="field"><span class="label">Job Title:</span><div class="value">${data.jobTitle || "N/A"}</div></div>
          <div class="field"><span class="label">Supervisor:</span><div class="value">${data.supervisorName || "N/A"}</div></div>
          <h2>Incident Details</h2>
          <div class="field"><span class="label">Date of Injury:</span><div class="value">${data.dateOfInjury || "N/A"}</div></div>
          <div class="field"><span class="label">Time of Injury:</span><div class="value">${data.timeOfInjury || "N/A"}</div></div>
          <div class="field"><span class="label">Mechanism of Injury:</span><div class="value">${data.mechanism || "N/A"}</div></div>
          <div class="field"><span class="label">Witnessed:</span><div class="value">${data.witnessed || "N/A"}</div></div>
          <h2>Body Parts Affected</h2>
          <div class="field"><div class="value">${data.bodyParts.length > 0 ? data.bodyParts.map(p => `<span class="badge">${p}</span>`).join(" ") : "None selected"}</div></div>
          <h2>PPE Worn at Time of Injury</h2>
          <div class="field"><div class="value">${data.ppeWorn.length > 0 ? data.ppeWorn.map(p => `<span class="badge">${p}</span>`).join(" ") : "None / Unknown"}</div></div>
          <h2>Description</h2>
          <div class="field"><span class="label">Original Statement:</span><div class="value">${data.description || "N/A"}</div></div>
          ${translatedDescription ? `<div class="field"><span class="label">English Translation:</span><div class="value">${translatedDescription}</div></div>` : ""}
          <h2>Treatment</h2>
          <div class="field"><span class="label">Treatment Type:</span><div class="value">${data.treatmentType || "N/A"}</div></div>
          ${data.firstAidDetails ? `<div class="field"><span class="label">First Aid Details:</span><div class="value">${data.firstAidDetails}</div></div>` : ""}
          <div class="field"><span class="label">Sent to Clinic / Hospital:</span><div class="value">${data.sentToClinic || "N/A"}</div></div>
          <div class="footer">This report was generated by Core Compliance Hub (CCHUB) Spanish Bilingual Medical Assistant. For clinical review only. Not a substitute for official OSHA 300 log entry.</div>
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
            <Button size="sm" variant="outline" className="bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black" onClick={() => setShowSummary(false)} data-testid="btn-injury-back">
              <ChevronLeft className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button size="sm" className="bg-[#FFC107] text-black" onClick={handlePrint} data-testid="btn-injury-print">
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800/60 border-gray-700 p-4 space-y-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1">Employee Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Employee</span>
              <p className="text-white font-medium">{data.employeeName || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Job Title</span>
              <p className="text-white font-medium">{data.jobTitle || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Supervisor</span>
              <p className="text-white font-medium">{data.supervisorName || "N/A"}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1 pt-1">Incident Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Date of Injury</span>
              <p className="text-white font-medium">{data.dateOfInjury || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Time of Injury</span>
              <p className="text-white font-medium">{data.timeOfInjury || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Mechanism</span>
              <p className="text-white font-medium">{data.mechanism || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Witnessed</span>
              <p className="text-white font-medium">{data.witnessed || "N/A"}</p>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">Body Parts Affected</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.bodyParts.length > 0 ? data.bodyParts.map((p) => (
                <Badge key={p} className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">{p}</Badge>
              )) : <span className="text-gray-500 text-sm">None selected</span>}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">PPE Worn at Time of Injury</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.ppeWorn.length > 0 ? data.ppeWorn.map((p) => (
                <Badge key={p} className="bg-blue-500/20 text-blue-300 no-default-hover-elevate no-default-active-elevate">{p}</Badge>
              )) : <span className="text-gray-500 text-sm">None / Unknown</span>}
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1 pt-1">Description</p>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">Original Statement</span>
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
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1 pt-1">Treatment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Treatment Type</span>
              <p className="text-white font-medium">{data.treatmentType || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Sent to Clinic/Hospital</span>
              <p className="text-white font-medium">{data.sentToClinic || "N/A"}</p>
            </div>
          </div>
          {data.firstAidDetails && (
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">First Aid Details</span>
              <p className="text-white font-medium">{data.firstAidDetails}</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">Injury Reporting</h3>
        <span className="text-sm text-gray-100">/ Reporte de Lesiones</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-100 mb-1 block">Employee Name / Nombre del empleado</label>
          <Input
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500"
            placeholder="Full name / Nombre completo"
            value={data.employeeName}
            onChange={(e) => setData({ ...data, employeeName: e.target.value })}
            data-testid="input-injury-name"
          />
        </div>
        <div>
          <label className="text-xs text-gray-100 mb-1 block">Job Title / Puesto de trabajo</label>
          <Input
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500"
            placeholder="e.g. Forklift Operator"
            value={data.jobTitle}
            onChange={(e) => setData({ ...data, jobTitle: e.target.value })}
            data-testid="input-injury-jobtitle"
          />
        </div>
        <div>
          <label className="text-xs text-gray-100 mb-1 block">Supervisor / Supervisor</label>
          <Input
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500"
            placeholder="Supervisor's name"
            value={data.supervisorName}
            onChange={(e) => setData({ ...data, supervisorName: e.target.value })}
            data-testid="input-injury-supervisor"
          />
        </div>
        <div>
          <label className="text-xs text-gray-100 mb-1 block">Date of Injury / Fecha de lesión</label>
          <Input
            type="date"
            className="bg-gray-800/60 border-gray-700 text-white"
            value={data.dateOfInjury}
            onChange={(e) => setData({ ...data, dateOfInjury: e.target.value })}
            data-testid="input-injury-date"
          />
        </div>
        <div>
          <label className="text-xs text-gray-100 mb-1 block">Time of Injury / Hora de lesión</label>
          <Input
            type="time"
            className="bg-gray-800/60 border-gray-700 text-white"
            value={data.timeOfInjury}
            onChange={(e) => setData({ ...data, timeOfInjury: e.target.value })}
            data-testid="input-injury-time"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-100 mb-2 block">Body Part Affected / Parte del cuerpo afectada</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {["upper", "torso", "lower"].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={bodyRegion === r ? "default" : "outline"}
              className={bodyRegion === r
                ? "bg-[#FFC107] text-black"
                : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
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
                  : "bg-gray-800/40 border-[#FFC107]/30 text-white hover:border-[#FFC107]/50"
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
        <label className="text-xs text-gray-100 mb-1 block">Mechanism of Injury / Mecanismo de lesión</label>
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
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <label className="text-xs text-gray-100 block">
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
                if (data.description.trim()) playSpanishAudio(data.description);
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
            <StopReadingButton />
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
        <label className="text-xs text-gray-100 mb-1 block">Witnessed? / ¿Hubo testigos?</label>
        <div className="flex flex-wrap gap-2">
          {["Yes / Sí", "No", "Unknown / Desconocido"].map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={data.witnessed === opt ? "default" : "outline"}
              className={data.witnessed === opt
                ? "bg-[#FFC107] text-black"
                : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
              }
              onClick={() => setData({ ...data, witnessed: opt })}
              data-testid={`btn-witnessed-${opt.split(" ")[0].toLowerCase()}`}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-100 mb-2 block flex items-center gap-1">
          <HardHat className="w-3.5 h-3.5" /> PPE Worn at Time of Injury / EPP usado al momento de la lesión
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {["Hard Hat", "Safety Glasses", "Gloves", "Steel-Toe Boots", "High-Vis Vest", "Hearing Protection", "Respirator", "Face Shield", "None"].map((ppe) => (
            <button
              key={ppe}
              onClick={() => {
                setData((prev) => ({
                  ...prev,
                  ppeWorn: prev.ppeWorn.includes(ppe) ? prev.ppeWorn.filter((p) => p !== ppe) : [...prev.ppeWorn, ppe],
                }));
              }}
              className={`p-2 rounded-md text-left text-xs transition-all border ${
                data.ppeWorn.includes(ppe)
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                  : "bg-gray-800/40 border-gray-600/50 text-white hover:border-blue-400/40"
              }`}
              data-testid={`btn-ppe-${ppe.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {ppe}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-100 mb-1 block">Treatment Type / Tipo de tratamiento</label>
        <select
          className="w-full rounded-md bg-gray-800/60 border border-gray-700 text-white p-2 text-sm"
          value={data.treatmentType}
          onChange={(e) => setData({ ...data, treatmentType: e.target.value })}
          data-testid="select-treatment-type"
        >
          <option value="">Select / Seleccione</option>
          <option value="First Aid Only">First Aid Only / Solo primeros auxilios</option>
          <option value="Medical Treatment Beyond First Aid">Medical Treatment Beyond First Aid / Tratamiento médico (más que primeros auxilios)</option>
          <option value="Emergency Room">Emergency Room / Sala de emergencias</option>
          <option value="Urgent Care">Urgent Care / Clínica de urgencias</option>
          <option value="Occupational Health Clinic">Occupational Health Clinic / Clínica de salud ocupacional</option>
          <option value="Refused Treatment">Refused Treatment / Rechazó tratamiento</option>
          <option value="No Treatment Needed">No Treatment Needed / Sin tratamiento necesario</option>
        </select>
      </div>

      {data.treatmentType === "First Aid Only" && (
        <div>
          <label className="text-xs text-gray-100 mb-1 block">First Aid Details / Detalles de primeros auxilios</label>
          <Input
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500"
            placeholder="e.g. Bandage applied, ice pack..."
            value={data.firstAidDetails}
            onChange={(e) => setData({ ...data, firstAidDetails: e.target.value })}
            data-testid="input-first-aid-details"
          />
        </div>
      )}

      <div>
        <label className="text-xs text-gray-100 mb-1 block">Sent to Clinic / Hospital? / ¿Enviado a clínica u hospital?</label>
        <div className="flex flex-wrap gap-2">
          {["Yes / Sí", "No", "Refused / Rechazó"].map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={data.sentToClinic === opt ? "default" : "outline"}
              className={data.sentToClinic === opt
                ? "bg-[#FFC107] text-black"
                : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
              }
              onClick={() => setData({ ...data, sentToClinic: opt })}
              data-testid={`btn-clinic-${opt.split(" ")[0].toLowerCase()}`}
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
    jobTitle: "",
    department: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medications: "",
    surgeries: "",
    conditions: [],
    allergies: "",
    hearingProtectionHistory: "",
    ppeRequired: [],
    priorWorkersComp: "",
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
    { title: "Patient Info",       titleEs: "Información del paciente" },
    { title: "Employment",         titleEs: "Empleo" },
    { title: "Emergency Contact",  titleEs: "Contacto de emergencia" },
    { title: "Medications",        titleEs: "Medicamentos" },
    { title: "Surgical History",   titleEs: "Historial quirúrgico" },
    { title: "Conditions",         titleEs: "Condiciones crónicas" },
    { title: "Occ. Health",        titleEs: "Salud ocupacional" },
  ];

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>New Hire Clinical Summary - CCHUB</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a2e}
        h1{color:#1a1a2e;border-bottom:2px solid #FFC107;padding-bottom:8px}
        h2{color:#444;font-size:14px;margin-top:24px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #eee;padding-bottom:4px}
        .field{margin:10px 0}.label{font-weight:bold;color:#555;font-size:13px}.value{margin-top:3px;font-size:14px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .badge{display:inline-block;background:#FFF3CD;color:#000;padding:2px 10px;border-radius:12px;font-size:12px;margin:2px;border:1px solid #FFC107}
        .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:16px;font-size:12px;color:#888}</style>
        </head><body>
        <h1>New Hire — Clinical Summary</h1>
        <p style="color:#888;font-size:13px">Core Compliance Hub — Generated ${new Date().toLocaleString()}</p>
        <h2>Patient Information</h2>
        <div class="grid">
          <div class="field"><span class="label">Name:</span><div class="value">${data.firstName} ${data.lastName}</div></div>
          <div class="field"><span class="label">DOB:</span><div class="value">${data.dob || "N/A"}</div></div>
          <div class="field"><span class="label">Allergies:</span><div class="value">${data.allergies || "NKDA"}</div></div>
        </div>
        <h2>Employment</h2>
        <div class="grid">
          <div class="field"><span class="label">Job Title:</span><div class="value">${data.jobTitle || "N/A"}</div></div>
          <div class="field"><span class="label">Department:</span><div class="value">${data.department || "N/A"}</div></div>
          <div class="field"><span class="label">Prior Workers' Comp Claim:</span><div class="value">${data.priorWorkersComp || "N/A"}</div></div>
        </div>
        <h2>Emergency Contact</h2>
        <div class="grid">
          <div class="field"><span class="label">Name:</span><div class="value">${data.emergencyContactName || "N/A"}</div></div>
          <div class="field"><span class="label">Phone:</span><div class="value">${data.emergencyContactPhone || "N/A"}</div></div>
        </div>
        <h2>Medical History</h2>
        <div class="field"><span class="label">Current Medications:</span><div class="value">${data.medications || "None reported"}</div></div>
        <div class="field"><span class="label">Surgical History:</span><div class="value">${data.surgeries || "None reported"}</div></div>
        <div class="field"><span class="label">Chronic Conditions:</span><div class="value">${data.conditions.length > 0 ? data.conditions.map(c => `<span class="badge">${c}</span>`).join(" ") : "None reported"}</div></div>
        <h2>Occupational Health</h2>
        <div class="field"><span class="label">Hearing Protection History:</span><div class="value">${data.hearingProtectionHistory || "N/A"}</div></div>
        <div class="field"><span class="label">PPE Required for Role:</span><div class="value">${data.ppeRequired.length > 0 ? data.ppeRequired.map(p => `<span class="badge">${p}</span>`).join(" ") : "Not specified"}</div></div>
        ${data.notes ? `<div class="field"><span class="label">Additional Notes:</span><div class="value">${data.notes}</div></div>` : ""}
        <div class="footer">This clinical summary was generated by Core Compliance Hub (CCHUB) Spanish Bilingual Medical Assistant. For clinical review only.</div>
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
            <Button size="sm" variant="outline" className="bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black" onClick={() => setShowSummary(false)} data-testid="btn-intake-back">
              <ChevronLeft className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button size="sm" className="bg-[#FFC107] text-black" onClick={handlePrint} data-testid="btn-intake-print">
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800/60 border-gray-700 p-4 space-y-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1">Patient Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Name</span>
              <p className="text-white font-medium">{data.firstName} {data.lastName}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Date of Birth</span>
              <p className="text-white font-medium">{data.dob || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Allergies</span>
              <p className="text-white font-medium">{data.allergies || "NKDA"}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1 pt-1">Employment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Job Title</span>
              <p className="text-white font-medium">{data.jobTitle || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Department</span>
              <p className="text-white font-medium">{data.department || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Prior Workers' Comp</span>
              <p className="text-white font-medium">{data.priorWorkersComp || "N/A"}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1 pt-1">Emergency Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Name</span>
              <p className="text-white font-medium">{data.emergencyContactName || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Phone</span>
              <p className="text-white font-medium">{data.emergencyContactPhone || "N/A"}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1 pt-1">Medical History</p>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">Current Medications</span>
            <p className="text-white font-medium">{data.medications || "None reported"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">Surgical History</span>
            <p className="text-white font-medium">{data.surgeries || "None reported"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">Chronic Conditions</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.conditions.length > 0 ? data.conditions.map((c) => (
                <Badge key={c} className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">{c}</Badge>
              )) : <span className="text-gray-500 text-sm">None reported</span>}
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700 pb-1 pt-1">Occupational Health</p>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">Hearing Protection History</span>
            <p className="text-white font-medium">{data.hearingProtectionHistory || "N/A"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-100 uppercase tracking-wide">PPE Required for Role</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.ppeRequired.length > 0 ? data.ppeRequired.map((p) => (
                <Badge key={p} className="bg-blue-500/20 text-blue-300 no-default-hover-elevate no-default-active-elevate">{p}</Badge>
              )) : <span className="text-gray-500 text-sm">Not specified</span>}
            </div>
          </div>
          {data.notes && (
            <div>
              <span className="text-xs text-gray-100 uppercase tracking-wide">Additional Notes</span>
              <p className="text-white font-medium">{data.notes}</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-5 h-5 text-[#FFC107]" />
        <h3 className="text-lg font-bold text-white">New Hire Intake</h3>
        <span className="text-sm text-gray-100">/ Admisión de nuevo empleado</span>
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
                  : "bg-[#F57C00]/60 text-white"
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
        <span className="text-xs text-gray-100 ml-2">{steps[step].title}</span>
      </div>

      {/* Step 0 — Patient Info */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-100 mb-1 block">First Name / Nombre</label>
              <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="Nombre" value={data.firstName} onChange={(e) => setData({ ...data, firstName: e.target.value })} data-testid="input-intake-firstname" />
            </div>
            <div>
              <label className="text-xs text-gray-100 mb-1 block">Last Name / Apellido</label>
              <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="Apellido" value={data.lastName} onChange={(e) => setData({ ...data, lastName: e.target.value })} data-testid="input-intake-lastname" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-100 mb-1 block">Date of Birth / Fecha de nacimiento</label>
            <Input type="date" className="bg-gray-800/60 border-gray-700 text-white" value={data.dob} onChange={(e) => setData({ ...data, dob: e.target.value })} data-testid="input-intake-dob" />
          </div>
          <div>
            <label className="text-xs text-gray-100 mb-1 block">Allergies / Alergias</label>
            <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="List allergies or NKDA / Liste alergias o NKDA" value={data.allergies} onChange={(e) => setData({ ...data, allergies: e.target.value })} data-testid="input-intake-allergies" />
          </div>
          <button onClick={() => playSpanishAudio("¿Cuál es su fecha de nacimiento? ¿Tiene alguna alergia conocida?")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-patient-info">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {/* Step 1 — Employment */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-100 mb-1 block">Job Title / Puesto de trabajo</label>
              <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="e.g. Machine Operator" value={data.jobTitle} onChange={(e) => setData({ ...data, jobTitle: e.target.value })} data-testid="input-intake-jobtitle" />
            </div>
            <div>
              <label className="text-xs text-gray-100 mb-1 block">Department / Departamento</label>
              <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="e.g. Welding, Assembly" value={data.department} onChange={(e) => setData({ ...data, department: e.target.value })} data-testid="input-intake-department" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-100 mb-1 block">Prior Workers' Comp Claim? / ¿Reclamación anterior de compensación laboral?</label>
            <div className="flex flex-wrap gap-2">
              {["Yes / Sí", "No", "Prefer not to say"].map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={data.priorWorkersComp === opt ? "default" : "outline"}
                  className={data.priorWorkersComp === opt
                    ? "bg-[#FFC107] text-black"
                    : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
                  }
                  onClick={() => setData({ ...data, priorWorkersComp: opt })}
                  data-testid={`btn-priorcomp-${opt.split(" ")[0].toLowerCase()}`}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
          <button onClick={() => playSpanishAudio("¿Cuál es su puesto de trabajo? ¿En qué departamento trabaja? ¿Ha tenido alguna reclamación de compensación laboral anterior?")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-employment">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {/* Step 2 — Emergency Contact */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-white">
            <span className="text-[#FFC107] font-semibold">¿A quién debemos contactar en caso de emergencia?</span>
            <br />
            <span className="text-gray-100 text-xs">Who should we contact in case of an emergency?</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-100 mb-1 block">Contact Name / Nombre del contacto</label>
              <Input className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="Full name" value={data.emergencyContactName} onChange={(e) => setData({ ...data, emergencyContactName: e.target.value })} data-testid="input-intake-ecname" />
            </div>
            <div>
              <label className="text-xs text-gray-100 mb-1 block">Phone / Teléfono</label>
              <Input type="tel" className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500" placeholder="(555) 555-5555" value={data.emergencyContactPhone} onChange={(e) => setData({ ...data, emergencyContactPhone: e.target.value })} data-testid="input-intake-ecphone" />
            </div>
          </div>
          <button onClick={() => playSpanishAudio("¿Cuál es el nombre de su contacto de emergencia? ¿Cuál es su número de teléfono?")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-emergency">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {/* Step 3 — Medications */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-white">
            <span className="text-[#FFC107] font-semibold">¿Está tomando algún medicamento actualmente?</span>
            <br />
            <span className="text-gray-100 text-xs">Are you currently taking any medications?</span>
          </p>
          <Textarea
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            placeholder="List all current medications, dosages / Liste todos los medicamentos actuales y dosis"
            value={data.medications}
            onChange={(e) => setData({ ...data, medications: e.target.value })}
            data-testid="textarea-intake-medications"
          />
          <button onClick={() => playSpanishAudio("¿Está tomando algún medicamento actualmente? Por favor indique el nombre y la dosis.")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-medications">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {/* Step 4 — Surgical History */}
      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm text-white">
            <span className="text-[#FFC107] font-semibold">¿Ha tenido alguna cirugía?</span>
            <br />
            <span className="text-gray-100 text-xs">Have you had any surgeries?</span>
          </p>
          <Textarea
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            placeholder="List all past surgeries and dates / Liste todas las cirugías pasadas y fechas"
            value={data.surgeries}
            onChange={(e) => setData({ ...data, surgeries: e.target.value })}
            data-testid="textarea-intake-surgeries"
          />
          <button onClick={() => playSpanishAudio("¿Ha tenido alguna cirugía? Por favor indique el tipo y la fecha.")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-surgeries">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {/* Step 5 — Chronic Conditions */}
      {step === 5 && (
        <div className="space-y-3">
          <p className="text-sm text-white">
            <span className="text-[#FFC107] font-semibold">¿Tiene alguna de las siguientes condiciones?</span>
            <br />
            <span className="text-gray-100 text-xs">Do you have any of the following conditions?</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {conditionsList.map((c) => (
              <button
                key={c.en}
                onClick={() => toggleCondition(c.en)}
                className={`p-2 rounded-md text-left text-sm border transition-all ${
                  data.conditions.includes(c.en)
                    ? "bg-[#FFC107]/20 border-[#FFC107]/50 text-[#FFC107]"
                    : "bg-gray-800/40 border-[#FFC107]/30 text-white hover:border-[#FFC107]/50"
                }`}
                data-testid={`btn-condition-${c.en.toLowerCase().replace(/[\s/]+/g, "-")}`}
              >
                <span className="font-medium">{c.en}</span>
                <span className="block text-xs opacity-70">{c.es}</span>
              </button>
            ))}
          </div>
          <button onClick={() => playSpanishAudio("¿Tiene alguna de las siguientes condiciones? Diabetes, hipertensión, asma, enfermedad del corazón, convulsiones, problemas de espalda, pérdida auditiva, apnea del sueño.")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-conditions">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      {/* Step 6 — Occupational Health */}
      {step === 6 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-100 mb-1 block flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Hearing Protection History / Historial de protección auditiva
            </label>
            <select
              className="w-full rounded-md bg-gray-800/60 border border-gray-700 text-white p-2 text-sm"
              value={data.hearingProtectionHistory}
              onChange={(e) => setData({ ...data, hearingProtectionHistory: e.target.value })}
              data-testid="select-hearing-protection"
            >
              <option value="">Select / Seleccione</option>
              <option value="Never used hearing protection">Never used / Nunca ha usado protección auditiva</option>
              <option value="Consistent use">Consistent use / Uso consistente</option>
              <option value="Occasional use">Occasional use / Uso ocasional</option>
              <option value="Prior noise-induced hearing loss diagnosis">Prior NIHL diagnosis / Diagnóstico previo de pérdida auditiva inducida por ruido</option>
              <option value="Currently uses hearing aids">Currently uses hearing aids / Usa audífonos actualmente</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-100 mb-2 block flex items-center gap-1">
              <HardHat className="w-3.5 h-3.5" /> PPE Required for Role / EPP requerido para el puesto
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {["Hard Hat", "Safety Glasses", "Gloves", "Steel-Toe Boots", "High-Vis Vest", "Hearing Protection", "Respirator", "Face Shield", "Chemical PPE", "Fall Protection"].map((ppe) => (
                <button
                  key={ppe}
                  onClick={() => {
                    setData((prev) => ({
                      ...prev,
                      ppeRequired: prev.ppeRequired.includes(ppe) ? prev.ppeRequired.filter((p) => p !== ppe) : [...prev.ppeRequired, ppe],
                    }));
                  }}
                  className={`p-2 rounded-md text-left text-xs transition-all border ${
                    data.ppeRequired.includes(ppe)
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-gray-800/40 border-gray-600/50 text-white hover:border-blue-400/40"
                  }`}
                  data-testid={`btn-ppe-req-${ppe.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {ppe}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-100 mb-1 block">Additional Notes / Notas adicionales</label>
            <Textarea
              className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 min-h-[60px]"
              placeholder="Any other occupational health information / Otra información de salud ocupacional"
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              data-testid="textarea-intake-notes"
            />
          </div>
          <button onClick={() => playSpanishAudio("¿Ha usado protección auditiva en trabajos anteriores? ¿Le han diagnosticado pérdida auditiva inducida por ruido?")} className="flex items-center gap-2 text-sm text-[#FFC107] hover:text-[#FFC107]/80 transition-colors" data-testid="btn-speak-occhealth">
            <Volume2 className="w-4 h-4" /> Ask in Spanish
          </button>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
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
              <span className="font-semibold text-white text-sm block mb-1">{s.title}</span>
              <p className="text-sm text-white mb-2">{s.en}</p>
              <button
                onClick={() => playSpanishAudio(s.es)}
                className="flex items-center gap-1 text-xs text-[#FFC107] hover:text-[#FFC107]/80 transition-colors"
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
      { en: "Remove your jacket", es: "Quítese la chaqueta" },
      { en: "Do not flush the toilet", es: "No le baje al agua al inodoro" },
      { en: "Do not turn on the faucet", es: "No abra el grifo" },
      { en: "Sign here please", es: "Firme aquí, por favor" },
      { en: "Wait here", es: "Espere aquí" },
      { en: "Follow me please", es: "Sígame, por favor" },
      { en: "You must provide 45 milliliters", es: "Debe proporcionar 45 mililitros" },
      { en: "Do not wash your hands until instructed", es: "No se lave las manos hasta que se le indique" },
      { en: "Leave all personal belongings here", es: "Deje todas sus pertenencias personales aquí" },
    ],
    shybladder: [
      { en: "You need to drink more fluids", es: "Necesita tomar más líquidos" },
      { en: "You have 3 hours to provide a specimen", es: "Tiene 3 horas para proporcionar una muestra" },
      { en: "You cannot leave the collection site", es: "No puede salir del sitio de recolección" },
      { en: "Try again when you are ready", es: "Intente de nuevo cuando esté listo" },
      { en: "Drink slowly, up to 40 ounces", es: "Beba lentamente, hasta 40 onzas" },
      { en: "The time has expired", es: "El tiempo ha expirado" },
      { en: "I will contact your employer now", es: "Contactaré a su empleador ahora" },
      { en: "We must start the 3-hour timer", es: "Debemos comenzar el temporizador de 3 horas" },
    ],
    outoftemp: [
      { en: "The specimen temperature is out of range", es: "La temperatura de la muestra está fuera de rango" },
      { en: "We need to collect a new specimen", es: "Necesitamos recolectar una nueva muestra" },
      { en: "This collection will be observed", es: "Esta recolección será observada" },
      { en: "This is a federal requirement", es: "Este es un requisito federal" },
      { en: "Both specimens will be sent to the lab", es: "Ambas muestras serán enviadas al laboratorio" },
      { en: "Do not discard the original specimen", es: "No descarte la muestra original" },
      { en: "Please wait while I complete the paperwork", es: "Espere mientras completo el papeleo" },
      { en: "I will document this on the form", es: "Lo documentaré en el formulario" },
    ],
    observed: [
      { en: "This collection must be observed", es: "Esta recolección debe ser observada" },
      { en: "This is a federal requirement", es: "Este es un requisito federal" },
      { en: "A same-gender observer will be present", es: "Un observador del mismo género estará presente" },
      { en: "Refusing is the same as a positive test", es: "Negarse es lo mismo que un resultado positivo" },
      { en: "Do you understand the procedure?", es: "¿Entiende el procedimiento?" },
      { en: "We are ready to begin", es: "Estamos listos para comenzar" },
      { en: "Please lift your shirt above your waist", es: "Por favor levante su camisa por encima de la cintura" },
      { en: "Please lower your clothing to mid-thigh", es: "Por favor baje su ropa hasta la mitad del muslo" },
    ],
    bat: [
      { en: "Do not eat, drink, or smoke", es: "No coma, beba ni fume" },
      { en: "Blow steadily into the mouthpiece", es: "Sople de manera constante en la boquilla" },
      { en: "Keep blowing until I say stop", es: "Siga soplando hasta que le diga que pare" },
      { en: "Do not burp during the waiting period", es: "No eructe durante el período de espera" },
      { en: "We must wait 15 minutes", es: "Debemos esperar 15 minutos" },
      { en: "The test is complete", es: "La prueba está completa" },
      { en: "Your result is below 0.02 — you are cleared", es: "Su resultado es menor de 0.02 — está autorizado" },
      { en: "Your result requires a confirmation test", es: "Su resultado requiere una prueba confirmatoria" },
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
        <span className="text-sm text-gray-100">/ Pruebas de Drogas y Alcohol</span>
        <StopReadingButton />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={activeTab === t.key ? "default" : "outline"}
            className={activeTab === t.key
              ? "bg-[#FFC107] text-black"
              : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black"
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
          <p className="text-xs text-gray-100 mt-0.5">{alertByTab[activeTab].desc}</p>
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
              onClick={() => playSpanishAudio(cmd.es)}
              className="flex items-center gap-2 p-2 rounded-md bg-gray-900/50 border border-[#FFC107]/40 hover:border-[#FFC107]/60 transition-all text-left"
              data-testid={`btn-quick-cmd-${activeTab}-${i}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-[#FFC107] shrink-0" />
              <span className="text-xs font-medium text-white">{cmd.en}</span>
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
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<Mode>("intake");
  const [gateState, setGateState] = useState<{ triedModes: string[]; unlocked: boolean }>(getBmaGateState);
  const [showGate, setShowGate] = useState(false);
  const gateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modes = [
    { key: "injury" as Mode, label: "Injury Reporting", labelEs: "Reporte de Lesiones", icon: AlertTriangle },
    { key: "intake" as Mode, label: "New Hire Intake", labelEs: "Admisión", icon: UserPlus },
    { key: "drugscreen" as Mode, label: "Drug Screen", labelEs: "Prueba de Drogas", icon: FlaskConical },
  ];

  const ALL_MODES = ["injury", "intake", "drugscreen"];

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (gateState.unlocked || isAuthenticated) return;

    const newTriedModes = [...new Set([...gateState.triedModes, newMode])];
    const updated = { ...gateState, triedModes: newTriedModes };
    setGateState(updated);
    saveBmaGateState(updated);

    if (newTriedModes.length >= ALL_MODES.length) {
      if (gateTimerRef.current) clearTimeout(gateTimerRef.current);
      gateTimerRef.current = setTimeout(() => setShowGate(true), 2200);
    }
  };

  useEffect(() => {
    return () => { if (gateTimerRef.current) clearTimeout(gateTimerRef.current); };
  }, []);

  const handleUnlock = () => {
    const updated = { ...gateState, unlocked: true };
    setGateState(updated);
    saveBmaGateState(updated);
    setShowGate(false);
  };

  const triedCount = gateState.triedModes.length;
  const isUnlocked = gateState.unlocked || isAuthenticated;

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
            <Languages className="w-3 h-3 mr-1" /> CCHUB Exclusive
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Spanish Bilingual Medical Assistant
          </h2>
          <p className="text-gray-100 max-w-2xl mx-auto">
            AI-powered occupational health tool with Spanish text-to-speech. Built for clinic staff serving bilingual workforces.
          </p>
        </div>

        {!isUnlocked && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700 text-sm">
              {triedCount < ALL_MODES.length ? (
                <>
                  <Star className="w-3.5 h-3.5 text-[#FFC107]" />
                  <span className="text-gray-300">
                    Free trial: <span className="text-[#FFC107] font-semibold">{triedCount} of {ALL_MODES.length}</span> visit types explored
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#FFC107]" />
                  <span className="text-gray-300">Trial complete — <span className="text-[#FFC107] font-semibold">unlock required</span></span>
                </>
              )}
            </div>
          </div>
        )}
        {isUnlocked && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-300 text-sm">Full access unlocked</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {modes.map((m) => (
            <Button
              key={m.key}
              variant={mode === m.key ? "default" : "outline"}
              className={mode === m.key
                ? "bg-[#FFC107] text-black font-bold"
                : "bg-[#F57C00] text-white border-[#F57C00] hover:bg-[#FFC107] hover:text-black font-semibold"
              }
              onClick={() => handleModeChange(m.key)}
              data-testid={`btn-mode-${m.key}`}
            >
              <m.icon className="w-4 h-4 mr-1.5" />
              {m.label}
              {!isUnlocked && gateState.triedModes.includes(m.key) && (
                <CheckCircle2 className="w-3 h-3 ml-1 text-green-400 opacity-80" />
              )}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Card className="bg-[hsl(222,47%,14%)] border-gray-700 p-3 sm:p-6">
            {mode === "injury" && <InjuryReportingMode />}
            {mode === "intake" && <NewHireIntakeMode />}
            {mode === "drugscreen" && <DrugScreenMode />}

            <div className="mt-6 pt-4 border-t border-gray-700">
              <BmaInteractiveChatMode />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <CommandCenterMode />
            </div>
          </Card>
          {showGate && !isUnlocked && <BmaLeadGate onUnlock={handleUnlock} />}
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Text-to-Speech powered by browser Web Speech API. Clinical summaries are for review purposes only.
        </p>
      </div>
    </section>
  );
}