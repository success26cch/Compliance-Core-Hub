import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageSquare, Users, ClipboardList, Download,
  Share2, Smartphone, Monitor, CheckCircle2, ArrowRight, MoreVertical
} from "lucide-react";
import coreyImg from "@assets/9_1771983400638.png";

type Platform = "ios" | "android-prompt" | "android-manual" | "desktop";

function detectPlatform(isInstallable: boolean): Platform {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  if (isIOS) return "ios";
  if (isAndroid && isInstallable) return "android-prompt";
  if (isAndroid) return "android-manual";
  return "desktop";
}

function InstallInstructions({ platform, onInstall }: { platform: Platform; onInstall: () => void }) {
  if (platform === "ios") {
    return (
      <div className="space-y-3">
        <p className="text-white/70 text-sm text-center mb-4">Follow these steps to add Corey to your iPhone:</p>
        <div className="space-y-3">
          {[
            { icon: <Share2 className="w-5 h-5 text-blue-400" />, step: "1", text: 'Tap the Share button at the bottom of your browser' },
            { icon: <Smartphone className="w-5 h-5 text-blue-400" />, step: "2", text: 'Scroll down and tap "Add to Home Screen"' },
            { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, step: "3", text: 'Tap "Add" — Corey will appear on your home screen' },
          ].map(({ icon, step, text }) => (
            <div key={step} className="flex items-start gap-3 bg-white/5 rounded-lg px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
              </div>
              <p className="text-white/80 text-sm leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (platform === "android-prompt") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-white/70 text-sm text-center">Tap below to install Corey directly on your Android device:</p>
        <Button
          onClick={onInstall}
          className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-3 text-base gap-2"
          data-testid="button-install-android"
        >
          <Download className="w-5 h-5" />
          Install Corey App
        </Button>
        <p className="text-white/40 text-xs">Free — no app store required</p>
      </div>
    );
  }

  if (platform === "android-manual") {
    return (
      <div className="space-y-3">
        <p className="text-white/70 text-sm text-center mb-4">Add Corey to your Android home screen:</p>
        <div className="space-y-3">
          {[
            { icon: <MoreVertical className="w-5 h-5 text-blue-400" />, step: "1", text: 'Tap the ⋮ menu in the top-right corner of Chrome' },
            { icon: <Smartphone className="w-5 h-5 text-blue-400" />, step: "2", text: 'Tap "Add to Home Screen"' },
            { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, step: "3", text: 'Tap "Add" — Corey will appear on your home screen' },
          ].map(({ icon, step, text }) => (
            <div key={step} className="flex items-start gap-3 bg-white/5 rounded-lg px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
              </div>
              <p className="text-white/80 text-sm leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Monitor className="w-12 h-12 text-blue-400/60" />
      <p className="text-white/70 text-sm text-center leading-relaxed">
        To install Corey on your phone, open{" "}
        <span className="text-blue-400 font-medium">corecompliancehub.com/corey</span>{" "}
        in Chrome on Android or Safari on iPhone, then follow the install prompt.
      </p>
    </div>
  );
}

const quickStart = [
  {
    icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
    title: "Ask your first question",
    desc: 'Try: "Is a sprained wrist from lifting recordable on the OSHA 300 Log?"',
  },
  {
    icon: <Users className="w-6 h-6 text-blue-400" />,
    title: "Run a Safety Meeting",
    desc: "Use the Safety Meeting mode to generate a structured, OSHA-backed agenda for your crew.",
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-blue-400" />,
    title: "Audit your OSHA 300 Log",
    desc: "Walk column-by-column through your log with Corey to catch errors before an inspection.",
  },
];

export default function WelcomeCorey() {
  const { user } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setPlatform(detectPlatform(isInstallable));
  }, [isInstallable]);

  const firstName = (user as any)?.firstName || (user as any)?.name?.split(" ")[0] || "there";

  const handleStartChatting = () => {
    localStorage.setItem("corey-welcomed", "1");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-10">

        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src={coreyImg}
            alt="Corey"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/40 shadow-lg shadow-blue-500/20"
            data-testid="img-corey-welcome"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="text-welcome-headline">
              Welcome to Corey, {firstName}!
            </h1>
            <p className="text-white/60 mt-2 text-base">
              Your AI-powered OSHA compliance expert is ready. Let's get you set up.
            </p>
          </div>
        </div>

        <Card className="w-full bg-white/5 border-blue-500/20 p-6 rounded-2xl shadow-lg shadow-blue-500/10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Add Corey to Your Phone</h2>
              <p className="text-white/50 text-xs">One-tap access from the field — no app store needed</p>
            </div>
          </div>

          {isInstalled ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="text-green-400 font-semibold">Corey is already installed!</p>
              <p className="text-white/50 text-sm text-center">You can open him directly from your home screen.</p>
            </div>
          ) : (
            <InstallInstructions platform={platform} onInstall={promptInstall} />
          )}
        </Card>

        <div className="w-full">
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4 text-center">
            3 Ways to Start Right Now
          </h3>
          <div className="grid gap-3">
            {quickStart.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-xl px-4 py-4"
                data-testid={`card-quickstart-${i}`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/corey" onClick={handleStartChatting} className="w-full">
          <Button
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold text-base py-4 gap-2 rounded-xl shadow-lg shadow-blue-500/30"
            data-testid="button-start-chatting"
          >
            Start Chatting with Corey
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>

        <p className="text-white/30 text-xs text-center -mt-6">
          Not a legal advice service · Accuracy of information may vary · No guarantee of outcome
        </p>
      </div>
    </div>
  );
}
