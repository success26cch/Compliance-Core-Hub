import { useState } from "react";
import { Link } from "wouter";
import { Lock, Check, ArrowRight, Mail, CheckCircle2, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

export interface ProductConfig {
  key: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  price?: string;
  priceNote?: string;
  learnMoreHref?: string;
  settingsTab?: string;
  accentColor?: string;
}

interface ProductGateProps {
  hasAccess: boolean | undefined;
  isLoading: boolean;
  product: ProductConfig;
  children: React.ReactNode;
  fullPage?: boolean;
}

export function ProductGate({ hasAccess, isLoading, product, children, fullPage = true }: ProductGateProps) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [requestError, setRequestError] = useState("");

  const accent = product.accentColor || "text-accent";
  const accentBg = product.accentColor ? "bg-accent/10" : "bg-accent/10";

  const handleRequestAccess = async () => {
    setRequesting(true);
    setRequestError("");
    try {
      await apiRequest("POST", "/api/request-access", {
        productKey: product.key,
      });
      setRequested(true);
    } catch {
      setRequestError("Could not send request. Please email team@corecompliancehub.com directly.");
    } finally {
      setRequesting(false);
    }
  };

  if (isLoading) {
    const inner = (
      <div className="w-full max-w-lg mx-auto py-16 px-4 space-y-4">
        <Skeleton className="h-14 w-14 rounded-xl mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
    if (!fullPage) return <div className="flex-1 flex items-center justify-center overflow-auto">{inner}</div>;
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        {inner}
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const gateContent = (
    <div className="w-full max-w-xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${accentBg} border border-accent/20 mb-4`}>
          <Lock className={`w-7 h-7 ${accent}`} />
        </div>
        <h2 className="text-2xl font-black text-primary mb-2" data-testid="text-product-gate-title">
          {product.name}
        </h2>
        <p className="text-base font-semibold text-accent mb-1">{product.tagline}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{product.description}</p>
      </div>

      <div className="bg-white dark:bg-card border border-border/60 rounded-2xl p-6 mb-5 shadow-sm" data-testid="card-product-gate">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Crown className={`w-4.5 h-4.5 ${accent}`} />
            <span className="font-black text-primary text-sm">{product.name}</span>
          </div>
          {product.price && (
            <div className="text-right">
              <div className={`text-xl font-black ${accent}`}>{product.price}</div>
              {product.priceNote && <div className="text-[11px] text-muted-foreground">{product.priceNote}</div>}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-2 mb-6">
          {product.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/80 leading-snug">{feature}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Link href={product.learnMoreHref || "/settings"}>
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-11 gap-2"
              data-testid="button-subscribe-product"
            >
              <Crown className="w-4 h-4" />
              Subscribe — View Plans
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {requested ? (
            <div className="flex items-center justify-center gap-2 py-3 text-green-700 dark:text-green-400 text-sm font-semibold bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Request sent! Our team will reach out to you shortly.
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-11 gap-2 font-semibold border-border/60 hover:border-accent/40 hover:text-accent"
              onClick={handleRequestAccess}
              disabled={requesting}
              data-testid="button-request-access"
            >
              {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Request Access / Contact Sales
            </Button>
          )}

          {requestError && (
            <p className="text-xs text-destructive text-center">{requestError}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Already subscribed?{" "}
        <Link href="/settings" className="underline hover:text-primary">
          Check your account settings
        </Link>{" "}
        or contact{" "}
        <a href="mailto:team@corecompliancehub.com" className="underline hover:text-primary">
          team@corecompliancehub.com
        </a>
      </p>
    </div>
  );

  if (!fullPage) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-auto bg-muted/30 p-4">
        {gateContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center overflow-auto py-8 px-4">
      {gateContent}
    </div>
  );
}

export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  iso_manager: {
    key: "iso_manager",
    name: "ISO Manager",
    tagline: "ACSI ISO Management System Platform",
    description: "A complete ISO management system for building, maintaining, and improving quality, environmental, safety, and specialty management systems — powered by Isa, your AI Lead Auditor.",
    features: [
      "Context of the Organization (4.1 & 4.2)",
      "My System Profile & Process Maps",
      "NC & CAPA with AI suggestions",
      "ISO Documentation Library",
      "Internal Audit Module",
      "Risk & Opportunity Register (6.1)",
      "Measurement & KPI Dashboard",
      "Management Review Module",
      "Training & Awareness Tracking",
      "Isa AI — Clause-cited guidance",
    ],
    price: "Contact for pricing",
    learnMoreHref: "/meet-iso-manager",
  },
  isa: {
    key: "isa",
    name: "Isa — AI Lead ISO Auditor",
    tagline: "ACSI ISO Intelligence Platform",
    description: "Isa is your dedicated Lead ISO Auditor AI — delivering clause-cited answers, audit coaching, nonconformance guidance, and corrective action support across all major ISO standards.",
    features: [
      "ISO 9001, 14001, 45001 expertise",
      "IATF 16949, AS9100, ISO 13485, 27001",
      "Clause-cited, hallucination-resistant answers",
      "Audit preparation coaching",
      "Nonconformance root cause guidance",
      "Corrective action plan assistance",
      "Unlimited conversations",
      "Custom ISO profile & standards focus",
    ],
    price: "Starting at $99/mo",
    learnMoreHref: "/meet-isa",
  },
  dot: {
    key: "dot",
    name: "DOT Fleet Compliance Hub",
    tagline: "FMCSA / DOT Fleet Management Platform",
    description: "Complete DOT compliance management for FMCSA-regulated employers — driver qualification files, random testing pools, accident registers, equipment tracking, and automated compliance alerts.",
    features: [
      "Driver Qualification File (DQF) management",
      "FMCSA Clearinghouse integration",
      "Random drug & alcohol testing pool",
      "Accident register & reporting",
      "Equipment & CDL expiration tracking",
      "Compliance status dashboard",
      "DOT violation alerts",
      "Audit-ready document management",
    ],
    price: "Included in Employer Platform",
    priceNote: "$599/mo · Employer Compliance Platform",
    learnMoreHref: "/settings",
  },
  env_hub: {
    key: "env_hub",
    name: "Environmental Compliance Hub",
    tagline: "EPA / Environmental Compliance Management Platform",
    description: "A complete environmental compliance command center — manage Universal Waste, Hazardous Waste (RCRA), SPCC oil spill prevention, Stormwater/SWPPP, and Air Quality permits in one audit-ready platform.",
    features: [
      "Universal Waste tracker with 1-year countdown clocks",
      "Hazardous Waste — SAP inspections & Manifest Manager",
      "Generator Status Calculator (VSQG / SQG / LQG)",
      "SPCC Tank & Secondary Containment Inspections",
      "Stormwater Visual Monitoring & BMP Schedule",
      "Air Quality Permit Filing Cabinet & Method 9 Log",
      "45-day manifest return flag (TSDF compliance)",
      "Ask Corey — CFR 40 / EPA regulatory AI guidance",
    ],
    price: "Contact for pricing",
    learnMoreHref: "/env-compliance-hub",
  },
  employer_platform: {
    key: "employer_platform",
    name: "Employer Compliance Platform",
    tagline: "CCHUB Occupational Health & Safety Platform",
    description: "The complete CCHUB employer platform — occupational health compliance, employee management, OSHA 300 incident logging, corrective action plans, DOT fleet compliance, and more.",
    features: [
      "Client Compliance Dashboard & Metrics",
      "Employee Management (50 employees included)",
      "OSHA 300 Incident Logging & Reporting",
      "Corrective Action Plans (CAPA)",
      "Digital Medical Passport (QR Check-in)",
      "DOT Fleet Compliance Hub",
      "Drug Screen & Medical Surveillance Tracking",
      "Priority Action Queue",
    ],
    price: "$599/mo",
    priceNote: "+$100/mo to add Corey AI · +$2/employee beyond 50",
    learnMoreHref: "/settings",
  },
};
