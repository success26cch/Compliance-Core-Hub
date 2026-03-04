import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import acsiLogo from "@assets/Transp1_1768928785892.png";

const CESAR_TIERS = [
  {
    number: "01",
    icon: Users,
    title: "CSR Assignment",
    subtitle: "Map requirements to the right people",
    description:
      "Identifies all applicable OEM Customer Specific Requirements and assigns them to the correct departments and process owners within your organization. No more guessing who owns what.",
    details: [
      "OEM CSR identification (Ford, GM, Stellantis, BMW, VW, etc.)",
      "Department-level requirement mapping",
      "Process owner assignment",
      "CSR matrix documentation",
    ],
  },
  {
    number: "02",
    icon: BookOpen,
    title: "CSR Training",
    subtitle: "Employees learn the requirements that apply to them",
    description:
      "Video-based training modules so every employee understands the Customer Specific Requirements relevant to their role and department — not generic ISO training, targeted CSR training.",
    details: [
      "Role-specific training content",
      "OEM requirement explanations",
      "Completion tracking and records",
      "Training evidence for audit readiness",
    ],
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "CSR Compliance Assessment",
    subtitle: "Know exactly where you stand",
    description:
      "A structured self-assessment tied directly to your applicable CSRs. Identifies compliance gaps, quantifies risk, and generates findings that trigger ACSI consulting engagement for implementation support.",
    details: [
      "CSR-specific audit questions",
      "Gap identification and scoring",
      "Risk-based findings report",
      "ACSI consulting trigger for critical gaps",
    ],
  },
];

const AUDIENCE = [
  "Tier 1 automotive suppliers",
  "IATF 16949 certified organizations",
  "Companies pursuing IATF 16949 certification",
  "Organizations managing Ford, GM, Stellantis, BMW, or VW requirements",
  "Quality managers responsible for OEM customer portals",
  "Suppliers facing second-party audits with CSR findings",
];

const OEMS = ["Ford Q1", "GM SQ", "Stellantis SQM", "BMW Group", "VW Formel Q", "Daimler", "Toyota SQAM", "Honda"];

export default function Cesar() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,7%)] text-white" data-testid="page-cesar">

      {/* Minimal nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to CCHUB
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <img src={acsiLogo} alt="ACSI" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-sm font-bold text-white/80">ACSI</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <img src={acsiLogo} alt="ACSI" className="w-14 h-14 object-contain" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 uppercase tracking-widest flex items-center gap-1.5">
              <Car className="w-3 h-3" /> IATF 16949 · Customer Specific Requirements
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Meet <span className="text-accent">CESAR</span>
          </h1>
          <p className="text-xl text-white/60 mb-3 font-medium">
            The CSR Management Platform for Automotive Suppliers
          </p>
          <p className="text-base text-white/50 max-w-2xl mx-auto leading-relaxed mb-8">
            Customer Specific Requirements are equally binding as IATF 16949 itself — but managing them across departments, training your team, and proving compliance to an auditor requires a purpose-built system. That's CESAR.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://acsi-quality.com" target="_blank" rel="noopener noreferrer">
              <Button className="bg-accent hover:bg-accent/90 text-white font-semibold gap-2 h-11 px-6" data-testid="button-get-cesar">
                Get CESAR <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/iso-manager">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-11 px-6">
                Talk to Isa about IATF
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* OEM badges */}
      <div className="border-t border-b border-white/10 py-5 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">Covers OEM Requirements From</p>
          <div className="flex flex-wrap justify-center gap-2">
            {OEMS.map((oem) => (
              <span key={oem} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                {oem}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Three tiers */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white mb-2">Three-Tier System</h2>
          <p className="text-white/50 text-sm">From identification through compliance proof — CESAR handles the full CSR lifecycle</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CESAR_TIERS.map((tier, i) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.35 }}
            >
              <Card
                className="bg-white/5 border-white/10 hover:border-accent/30 transition-all duration-200 hover:bg-white/8 h-full p-6"
                data-testid={`card-cesar-tier-${i + 1}`}
              >
                <div className="mb-4">
                  <span className="text-4xl font-black text-white/10">{tier.number}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <tier.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-black text-white mb-1">{tier.title}</h3>
                <p className="text-xs text-accent font-medium mb-3">{tier.subtitle}</p>
                <p className="text-xs text-white/50 leading-relaxed mb-4">{tier.description}</p>
                <ul className="space-y-2">
                  {tier.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-xs text-white/40">
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-white/10 px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-black text-white">Who CESAR Is For</h2>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                CESAR is purpose-built for the automotive supply chain — organizations where OEM customer requirements are not optional, and where an auditor will ask for evidence that CSRs have been identified, assigned, trained, and assessed.
              </p>
              <ul className="space-y-3">
                {AUDIENCE.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA card */}
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-5 shadow-lg">
                <img src={acsiLogo} alt="ACSI" className="w-11 h-11 object-contain" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Get CESAR</h3>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                CESAR is available through ACSI's CSR Connect Hub. Contact ACSI to learn about pricing and implementation.
              </p>
              <div className="space-y-3">
                <a href="https://acsi-quality.com" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold gap-2" data-testid="button-get-cesar-cta">
                    Visit acsi-quality.com <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <a href="mailto:info@acsi-quality.com">
                  <Button variant="outline" className="w-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white text-sm">
                    info@acsi-quality.com
                  </Button>
                </a>
                <p className="text-white/30 text-xs pt-1">📞 313-479-4545</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="border-t border-white/10 px-6 py-6 text-center">
        <p className="text-xs text-white/25">
          CESAR is an ACSI product sold through the CSR Connect Hub. For IATF 16949 auditing guidance, use{" "}
          <Link href="/iso-manager" className="text-accent hover:underline">Isa on the ACSI ISO Manager</Link>.
        </p>
      </div>
    </div>
  );
}
