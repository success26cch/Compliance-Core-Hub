import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Smartphone, Share2, MoreVertical, Monitor, BookOpen, ClipboardCheck, MessageCircle, ChevronRight } from "lucide-react";

const ORANGE = "hsl(24,95%,53%)";
const BG = "hsl(222,47%,11%)";

export default function WelcomeIsa() {
  const { user } = useAuth();
  const { data: isaProfile } = useQuery<any>({
    queryKey: ["/api/isa-profile"],
    retry: false,
  });

  const displayName = isaProfile?.preferredName || user?.firstName || "there";

  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");
    else setPlatform("desktop");
  }, []);

  const handleStart = () => {
    localStorage.setItem("isa-welcomed", "1");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: BG }}>
      <div className="w-full max-w-lg">

        {/* Avatar + greeting */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-4xl font-black mb-4 shadow-2xl"
            style={{ background: ORANGE }}
          >
            I
          </div>
          <h1 className="text-3xl font-black text-white text-center">
            Welcome, {displayName}!
          </h1>
          <p className="text-white/50 mt-2 text-center text-base">
            I'm Isa — your ACSI Lead ISO Auditor AI. I'm ready when you are.
          </p>
        </div>

        {/* PWA Install Card */}
        <div className="rounded-2xl p-6 border mb-5" style={{ borderColor: `${ORANGE}40`, background: `${ORANGE}08` }}>
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5" style={{ color: ORANGE }} />
            <h2 className="text-white font-bold">Add Isa to Your Phone</h2>
          </div>

          {platform === "ios" && (
            <div className="space-y-3">
              <p className="text-white/55 text-sm">Install from Safari for one-tap access from the field:</p>
              {[
                { icon: Share2, text: "Tap the Share icon at the bottom of Safari" },
                { icon: CheckCircle2, text: 'Scroll down and tap "Add to Home Screen"' },
                { icon: CheckCircle2, text: 'Tap "Add" — Isa appears on your home screen' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: ORANGE }}>
                    {i + 1}
                  </div>
                  <p className="text-white/70 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          )}

          {platform === "android" && (
            <div className="space-y-3">
              <p className="text-white/55 text-sm">Install from Chrome for one-tap access:</p>
              {[
                { text: 'Tap the address bar — look for the "Install app" icon (⊕)' },
                { text: "Or tap the ⋮ menu (top right) → Install app → Install" },
                { text: "Isa appears on your home screen, ready to go" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: ORANGE }}>
                    {i + 1}
                  </div>
                  <p className="text-white/70 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          )}

          {platform === "desktop" && (
            <div className="flex items-start gap-3">
              <Monitor className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
              <p className="text-white/55 text-sm">
                Open <strong className="text-white/75">corecompliancehub.com/isa</strong> on your phone in Chrome or Safari to install Isa directly to your home screen.
              </p>
            </div>
          )}
        </div>

        {/* Quick-start tips */}
        <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.03] mb-6">
          <h2 className="text-white/70 text-xs font-bold uppercase tracking-widest mb-4">3 Ways to Start</h2>
          <div className="space-y-3">
            {[
              {
                icon: MessageCircle,
                title: "Ask Isa a clause question",
                sub: "\"What does Clause 8.4.1 require for supplier controls?\"",
              },
              {
                icon: ClipboardCheck,
                title: "Run a 'Would I pass?' check",
                sub: "\"We do X — would that satisfy Clause 6.1?\"",
              },
              {
                icon: BookOpen,
                title: "Get a post-audit debrief",
                sub: "\"I got this NC — help me understand it and prioritize my response.\"",
              },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ORANGE}18` }}>
                  <tip.icon className="w-4 h-4" style={{ color: ORANGE }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{tip.title}</p>
                  <p className="text-white/40 text-xs italic mt-0.5">{tip.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link href="/isa">
          <Button
            className="w-full font-bold text-white text-base py-6 rounded-xl"
            style={{ background: ORANGE }}
            onClick={handleStart}
            data-testid="button-start-isa"
          >
            Start Talking to Isa <ChevronRight className="w-5 h-5 ml-1.5" />
          </Button>
        </Link>

        <p className="text-center text-white/25 text-xs mt-4">
          You can update your profile anytime from Settings.
        </p>
      </div>
    </div>
  );
}
