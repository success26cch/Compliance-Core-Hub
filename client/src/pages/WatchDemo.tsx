import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, Maximize, ArrowRight, ArrowLeft, CheckCircle2, ShoppingCart, Loader2, Mail, User, Calendar } from "lucide-react";
import logoUrl from "@assets/1_1770683748423.png";

const HIGHLIGHTS = [
  "AI-powered OSHA compliance guidance with CFR citations",
  "Incident logging with automatic OSHA 300 recordability flags",
  "CAPA tracking with SMS and email alerts",
  "Employee medical surveillance and expiration tracking",
  "Digital Medical Passport via QR code",
  "ISO management with Isa AI built in",
  "Spanish Bilingual Medical Assistant for your MAs",
  "Multi-site analytics dashboard",
];

export default function WatchDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState(false);

  // Gate state
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState("");

  // Set muted via ref — React's `muted` JSX prop doesn't render as an HTML
  // attribute due to a long-standing React bug, which causes iOS Safari to
  // immediately fire onError on unmuted video before any user gesture.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, []);

  const retry = () => {
    const v = videoRef.current;
    if (!v) return;
    setError(false);
    v.load();
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = true;
      v.play()
        .then(() => { setPlaying(true); setHasStarted(true); setError(false); })
        .catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const goFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if ((v as any).webkitEnterFullscreen) {
      (v as any).webkitEnterFullscreen();
    } else {
      v.requestFullscreen?.();
    }
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setGateError("Please enter your name and email to continue.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setGateError("Please enter a valid email address.");
      return;
    }
    setGateError("");
    setSubmitting(true);
    try {
      await fetch("/api/demo-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
    } catch {
      // fire-and-forget — unlock the video even if the lead capture fails
    }
    setSubmitting(false);
    setUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[hsl(222,47%,6%)]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home-logo">
              <img src={logoUrl} alt="CCHUB" className="h-10 w-auto" />
              <span className="text-lg font-bold text-white hidden sm:block">Core Compliance Hub</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Link href="/get-started">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-2" data-testid="button-get-started-header">
                Get Started <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-10 px-4 text-center max-w-4xl mx-auto">
        <Badge className="bg-accent/20 text-accent border border-accent/30 mb-5 text-sm px-4 py-1.5" data-testid="badge-demo-hero">
          Platform Overview
        </Badge>
        <h1 className="text-4xl md:text-6xl font-display font-black text-white leading-tight mb-5" data-testid="text-demo-title">
          See CCHUB in Action
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
          Watch how Core Compliance Hub brings AI-powered compliance, incident management, ISO tools, and employee health into one seamless platform.
        </p>
      </section>

      {/* Video / Gate */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {!unlocked ? (
          /* ── Lead-capture gate ── */
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden shadow-2xl shadow-black/60">
            {/* Blurred preview hint */}
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-[hsl(222,47%,10%)] to-[hsl(222,47%,6%)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-20 select-none pointer-events-none">
                <Play className="w-24 h-24 text-white" fill="white" />
              </div>
              <div className="relative z-10 text-center px-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center mb-4">
                  <Play className="w-7 h-7 text-accent ml-1" fill="currentColor" />
                </div>
                <p className="text-white/80 font-semibold text-lg">Platform Demo Video</p>
                <p className="text-white/40 text-sm mt-1">~9 min full platform walkthrough</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-8 md:px-10">
              <h2 className="text-xl md:text-2xl font-display font-black text-white mb-1 text-center">
                Watch the Full Demo
              </h2>
              <p className="text-white/50 text-sm text-center mb-6">
                Enter your name and email to unlock instant access — no password needed.
              </p>

              <form onSubmit={handleGateSubmit} className="max-w-md mx-auto space-y-4" data-testid="form-demo-gate">
                <div className="space-y-1.5">
                  <Label htmlFor="gate-name" className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </Label>
                  <Input
                    id="gate-name"
                    data-testid="input-demo-name"
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent"
                    disabled={submitting}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gate-email" className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Work Email
                  </Label>
                  <Input
                    id="gate-email"
                    data-testid="input-demo-email"
                    type="email"
                    placeholder="jane@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent"
                    disabled={submitting}
                    autoComplete="email"
                  />
                </div>

                {gateError && (
                  <p className="text-red-400 text-sm" data-testid="text-gate-error">{gateError}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold gap-2"
                  disabled={submitting}
                  data-testid="button-demo-unlock"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</>
                  ) : (
                    <><Play className="w-4 h-4" fill="currentColor" /> Watch the Demo</>
                  )}
                </Button>

                <p className="text-center text-white/30 text-xs pt-1">
                  No spam. We'll only reach out if you want us to.
                </p>
              </form>

              {/* Bonus CTA */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-white/40 text-sm mb-3">Prefer a live walkthrough?</p>
                <Link href="/contact">
                  <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10 gap-2" data-testid="button-schedule-demo-gate">
                    <Calendar className="w-3.5 h-3.5" /> Schedule a Personalized Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── Video player (unlocked) ── */
          <>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 bg-black" data-testid="section-video-player">
              <video
                ref={videoRef}
                src="/api/demo-video"
                playsInline
                preload="metadata"
                onPlay={() => { setPlaying(true); setHasStarted(true); setError(false); }}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onError={() => setError(true)}
                className="w-full block"
                style={{ display: "block", aspectRatio: "16/9", backgroundColor: "#000" }}
                data-testid="video-demo"
              />

              {!hasStarted && !error && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={toggle}
                  data-testid="overlay-video-play"
                >
                  <div className="w-20 h-20 rounded-full bg-black/70 flex items-center justify-center border-2 border-white/30 shadow-xl">
                    <Play className="w-9 h-9 text-white ml-1" fill="white" />
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3 cursor-pointer"
                  onClick={retry}
                  data-testid="overlay-video-error"
                >
                  <div className="w-20 h-20 rounded-full bg-black/70 flex items-center justify-center border-2 border-white/30 shadow-xl">
                    <Play className="w-9 h-9 text-white ml-1" fill="white" />
                  </div>
                  <p className="text-white/60 text-xs text-center px-8">Tap to play</p>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
                <button
                  onClick={toggle}
                  className="text-white hover:text-accent transition-colors"
                  data-testid="button-video-toggle"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing
                    ? <Pause className="w-5 h-5" fill="currentColor" />
                    : <Play className="w-5 h-5" fill="currentColor" />}
                </button>
                <button
                  onClick={goFullscreen}
                  className="text-white hover:text-accent transition-colors"
                  data-testid="button-video-fullscreen"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-center text-white/40 text-sm mt-4">
              Core Compliance Hub
            </p>
          </>
        )}
      </section>

      {/* Highlights */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-black text-white mb-3" data-testid="text-highlights-title">
            Just a Peek at the Power of Corey
          </h2>
          <p className="text-white/50">One platform. Every tool your compliance team needs.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              data-testid={`item-highlight-${item.slice(0, 20).toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span className="text-sm text-white/80 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4" data-testid="text-cta-title">
            Ready to Get Started?
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Choose a plan and have your team running on CCHUB today. No long contracts, no setup fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-10 gap-2" data-testid="button-cta-get-started">
                <ShoppingCart className="w-4 h-4" />
                Choose a Plan
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white text-slate-800 border-white hover:bg-slate-100 font-bold px-10" data-testid="button-cta-contact">
                Talk to Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
