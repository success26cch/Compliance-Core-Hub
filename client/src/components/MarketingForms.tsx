import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail } from "lucide-react";

/* ─── Shared helpers ──────────────────────────────────────── */
function Field({
  label, id, type = "text", placeholder, value, onChange, required, as, rows, accent,
}: {
  label: string; id: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
  as?: "textarea"; rows?: number; accent: string;
}) {
  const base =
    "w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-white/50 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id} rows={rows ?? 3} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          required={required}
          className={`${base} focus:ring-${accent}/30 resize-none`}
          data-testid={`input-${id}`}
        />
      ) : (
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          required={required}
          className={`${base} focus:ring-${accent}/30`}
          data-testid={`input-${id}`}
        />
      )}
    </div>
  );
}

/* ─── Walkthrough Request Form ────────────────────────────── */
export function WalkthroughRequestForm({
  product,
  accentBg = "bg-accent hover:bg-accent/90",
  accentText = "text-accent",
  accentBorder = "border-accent/20",
  accentGradientFrom = "from-white/[0.03]",
  accentRing = "accent",
  heading = "Request a Walkthrough",
  subtext = "Tell us a bit about your organization and we'll schedule a personalized walkthrough at your convenience.",
}: {
  product: string;
  accentBg?: string;
  accentText?: string;
  accentBorder?: string;
  accentGradientFrom?: string;
  accentRing?: string;
  heading?: string;
  subtext?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !company.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          inquiryType: `Walkthrough Request — ${product}`,
          message: message.trim() || `Interested in a walkthrough of ${product}.`,
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong — please email us at team@corecompliancehub.com");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-16 px-6 border-t border-white/10">
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-2xl border ${accentBorder} bg-gradient-to-br ${accentGradientFrom} to-white/[0.01] p-8`}>
          <div className="flex items-center gap-3 mb-2">
            <Mail className={`w-5 h-5 ${accentText}`} />
            <h3 className="text-xl font-black text-white">{heading}</h3>
          </div>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">{subtext}</p>

          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <CheckCircle2 className={`w-10 h-10 ${accentText}`} />
              <p className="text-white font-bold text-lg">Request received!</p>
              <p className="text-white/50 text-sm text-center max-w-sm">
                We'll reach out within one business day to schedule your walkthrough.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your Name" id="walkthrough-name" placeholder="Jane Smith" value={name} onChange={setName} required accent={accentRing} />
                <Field label="Work Email" id="walkthrough-email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} required accent={accentRing} />
              </div>
              <Field label="Company" id="walkthrough-company" placeholder="Acme Manufacturing" value={company} onChange={setCompany} required accent={accentRing} />
              <Field label="Anything you'd like us to know? (optional)" id="walkthrough-message" placeholder="e.g. We have 3 facilities and are targeting ISO 9001 certification by Q4..." value={message} onChange={v => setMessage(v)} as="textarea" rows={3} accent={accentRing} />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button
                type="submit"
                disabled={submitting}
                className={`w-full h-11 font-bold text-white ${accentBg}`}
                data-testid="button-walkthrough-submit"
              >
                {submitting ? "Sending…" : "Request a Walkthrough"}
              </Button>
              <p className="text-center text-white/30 text-xs">
                We respond within 1 business day · No commitment required
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Subscribe Form ──────────────────────────────────────── */
export function SubscribeForm({
  source,
  accentBg = "bg-accent hover:bg-accent/90",
  accentText = "text-accent",
  heading = "Stay in the loop",
  subtext = "Get compliance tips and platform updates — no spam, unsubscribe anytime.",
  bgClass = "bg-[#0f172a]/60",
}: {
  source: string;
  accentBg?: string;
  accentText?: string;
  heading?: string;
  subtext?: string;
  bgClass?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes("@")) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), source }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`py-12 px-6 border-t border-white/10 ${bgClass}`}>
      <div className="max-w-xl mx-auto text-center space-y-4">
        <h3 className="text-lg font-black text-white">{heading}</h3>
        <p className="text-white/50 text-sm">{subtext}</p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 py-3 font-semibold">
            <CheckCircle2 className={`w-5 h-5 ${accentText}`} />
            <span className={accentText}>You're on the list — thanks!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-2">
            <input
              type="text" placeholder="Your name" value={name}
              onChange={e => setName(e.target.value)} required
              data-testid={`input-subscribe-name-${source}`}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
            />
            <input
              type="email" placeholder="Work email" value={email}
              onChange={e => setEmail(e.target.value)} required
              data-testid={`input-subscribe-email-${source}`}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
            />
            <Button
              type="submit" disabled={submitting}
              className={`${accentBg} text-white font-bold px-6 shrink-0`}
              data-testid={`button-subscribe-submit-${source}`}
            >
              {submitting ? "…" : "Subscribe"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
