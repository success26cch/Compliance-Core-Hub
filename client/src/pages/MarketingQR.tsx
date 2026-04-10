import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Truck, Bot, Stethoscope, LayoutDashboard } from "lucide-react";
import { ProtectedLayout } from "@/components/Layout";

const BASE = "https://www.corecompliancehub.com";

const CARDS = [
  {
    id: "corey",
    label: "Corey – AI Compliance Expert",
    tagline: "AI-powered OSHA, EPA & occupational health guidance",
    url: `${BASE}/corey`,
    icon: Bot,
    color: "from-blue-600 to-blue-800",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  {
    id: "dot",
    label: "DOT Fleet HUB",
    tagline: "FMCSA/DOT compliance management for fleets",
    url: `${BASE}/dot-compliance-hub`,
    icon: Truck,
    color: "from-green-600 to-green-800",
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
  },
  {
    id: "bma",
    label: "Bilingual Medical Assistant",
    tagline: "Spanish/English medical intake & body map tools",
    url: `${BASE}/bma`,
    icon: Stethoscope,
    color: "from-rose-600 to-rose-800",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
  },
  {
    id: "dashboard",
    label: "Core Compliance Hub",
    tagline: "The complete employer occupational health platform",
    url: `${BASE}/`,
    icon: LayoutDashboard,
    color: "from-primary to-primary/80",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
];

function QRCard({ card }: { card: typeof CARDS[0] }) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const Icon = card.icon;

  useEffect(() => {
    QRCode.toDataURL(card.url, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setDataUrl);
  }, [card.url]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `CCHUB-QR-${card.id}.png`;
    a.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-md overflow-hidden flex flex-col" data-testid={`card-qr-${card.id}`}>
      {/* Top color band */}
      <div className={`bg-gradient-to-r ${card.color} px-5 py-4 flex items-center gap-3`}>
        <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${card.iconColor}`} />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">{card.label}</p>
          <p className="text-white/70 text-xs mt-0.5 leading-tight">{card.tagline}</p>
        </div>
      </div>

      {/* QR code */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR code for ${card.label}`}
            className="w-52 h-52 rounded-xl border border-border/40 shadow-sm"
            data-testid={`img-qr-${card.id}`}
          />
        ) : (
          <div className="w-52 h-52 rounded-xl bg-muted animate-pulse" />
        )}
        <p className="text-xs text-muted-foreground text-center break-all px-2">{card.url}</p>
      </div>

      {/* Download */}
      <div className="px-6 pb-6">
        <Button
          onClick={handleDownload}
          disabled={!dataUrl}
          className="w-full gap-2 bg-accent hover:bg-accent/90 text-white"
          data-testid={`button-download-qr-${card.id}`}
        >
          <Download className="w-4 h-4" />
          Download PNG
        </Button>
      </div>
    </div>
  );
}

export default function MarketingQR() {
  const handleDownloadAll = async () => {
    for (const card of CARDS) {
      const dataUrl = await QRCode.toDataURL(card.url, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `CCHUB-QR-${card.id}.png`;
      a.click();
      await new Promise(r => setTimeout(r, 300));
    }
  };

  return (
    <ProtectedLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Marketing QR Codes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Show or share a QR code on the spot — anyone who scans it lands directly on that page.
            </p>
          </div>
          <Button onClick={handleDownloadAll} variant="outline" className="gap-2 shrink-0" data-testid="button-download-all-qr">
            <Download className="w-4 h-4" />
            Download All
          </Button>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map(card => (
            <QRCard key={card.id} card={card} />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          QR codes link to <span className="font-medium">www.corecompliancehub.com</span>
        </p>
      </div>
    </ProtectedLayout>
  );
}
