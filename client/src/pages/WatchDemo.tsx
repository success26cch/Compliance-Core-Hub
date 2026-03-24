import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Maximize, ArrowRight, ArrowLeft, CheckCircle2, ShoppingCart } from "lucide-react";
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

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const goFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
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

      {/* Video Player */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 bg-black" data-testid="section-video-player">
          <video
            ref={videoRef}
            src="/api/demo-video"
            playsInline
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onClick={toggle}
            className="w-full block cursor-pointer"
            style={{ display: "block", aspectRatio: "16/9", backgroundColor: "#000" }}
            data-testid="video-demo"
          />

          {/* Play/Pause overlay — shows briefly on toggle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!playing && (
              <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </div>
            )}
          </div>

          {/* Bottom controls */}
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
