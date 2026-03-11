import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, QrCode, Copy, Check } from "lucide-react";
import coreyImg from "@assets/9_1771983400638.png";

export default function QRCodePage() {
  const [qrSvg, setQrSvg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const tryCoreyUrl = `${window.location.origin}/try-corey`;

  useEffect(() => {
    fetch("/api/qr/try-corey")
      .then(res => res.text())
      .then(svg => {
        setQrSvg(svg);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDownloadPNG = () => {
    window.open("/api/qr/try-corey/png", "_blank");
  };

  const handleDownloadSVG = () => {
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corey-qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tryCoreyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white" data-testid="page-qr-code">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <button className="text-white/60 hover:text-white transition" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <img src={coreyImg} alt="Corey" className="w-10 h-10 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-qr-title">Corey QR Code</h1>
            <p className="text-white/50 text-sm">For your marketing materials</p>
          </div>
        </div>

        <div className="bg-[hsl(222,47%,15%)] rounded-lg border border-white/10 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20 mb-4">
              <QrCode className="w-4 h-4" />
              Scan to Try Corey
            </div>
            <p className="text-white/60 text-sm">
              Visitors can scan this QR code to try Corey with {3} free questions. Their usage is tracked by email — no way to bypass the limit.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 mx-auto max-w-xs mb-6" data-testid="qr-code-display">
            {loading ? (
              <div className="w-64 h-64 mx-auto flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-full" />
            )}
          </div>

          <div className="text-center mb-6">
            <p className="text-white/40 text-xs font-mono bg-white/5 rounded px-3 py-2 inline-block" data-testid="text-try-corey-url">
              {tryCoreyUrl}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownloadPNG} className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold" data-testid="button-download-png">
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button onClick={handleDownloadSVG} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" data-testid="button-download-svg">
              <Download className="w-4 h-4 mr-2" />
              Download SVG
            </Button>
            <Button onClick={handleCopyLink} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" data-testid="button-copy-link">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </div>

        <div className="mt-8 bg-[hsl(222,47%,15%)] rounded-lg border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-3" data-testid="text-qr-tips-title">Tips for Marketing Materials</h3>
          <ul className="space-y-2 text-white/60 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Print the QR code on business cards, flyers, or trade show materials
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Each person gets 3 free questions — tracked by email address
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              After their free questions, they're prompted to subscribe at $199/mo
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Use the SVG format for print materials (scales to any size without losing quality)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Use the PNG format for digital marketing (emails, social media, presentations)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
