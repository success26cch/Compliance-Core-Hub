import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCreateLead } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, CheckCircle2, Bot, FileText, ArrowRight, Activity } from "lucide-react";
import logoUrl from "@assets/1_1767636977932.png";
import teamImageUrl from "@assets/1-8_website_picture_1767901013934.png";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  const { mutate, isPending } = useCreateLead();

  const form = useForm<z.infer<typeof leadFormSchema>>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof leadFormSchema>) => {
    mutate(data, {
      onSuccess: () => form.reset(),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto" />
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <a href="/api/login">
                <Button variant="outline">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center w-full">
              <img src={logoUrl} alt="Core Compliance Hub" className="h-48 md:h-64 w-auto mx-auto" />
              <img src={teamImageUrl} alt="CCH Team - Safety Professionals" className="w-full max-w-2xl h-auto object-contain mt-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-medium text-sm">
              <Activity className="w-4 h-4" />
              Occupational Medicine Simplified
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary leading-tight">
              Stop Guessing. Start Complying. <span className="text-accent">Your 24/7 Occupational Health Expert.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              One wrong OSHA entry can cost thousands. One missed DOT guideline can sideline your fleet. Core Compliance Hub gives your team instant, expert-level clarity on:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span><strong>OSHA Recordables:</strong> Know instantly if an injury is a 'Reportable' or just 'First Aid.'</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span><strong>DOT Compliance:</strong> Navigate physical requirements and 'Fit-for-Duty' status without the legal headache.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span><strong>Drug Screening:</strong> Decode the 5-panel vs. 10-panel maze to ensure you're testing for what actually matters.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span><strong>Complete Coverage:</strong> From pre-employment physicals to exit exams, respirator fit tests to return-to-work clearances—CCH handles every touchpoint in your employee health lifecycle.</span>
              </li>
            </ul>
            <p className="text-lg text-muted-foreground font-medium mt-4">
              Turn your safety manual into a conversation. Protect your people, protect your bottom line.
            </p>
            <p className="text-2xl md:text-3xl font-serif font-bold text-accent mt-6 text-center tracking-wide italic">
              WELCOME TO CCH — CREATING WORKFORCE ECOSYSTEMS, ONE EMPLOYEE AT A TIME.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg font-semibold shadow-lg shadow-primary/25">
                  Get Started Free
                </Button>
              </a>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-lg">
                  See Features
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Lead Magnet Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-border/50 p-8 md:p-10 relative z-10">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl"></div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-display text-primary">Free Recordability Cheat Sheet</h3>
                  <p className="text-muted-foreground">
                    Stop guessing. Download our comprehensive guide to OSHA 1904 recordability criteria.
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Your Name" className="h-12 bg-muted/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Work Email" className="h-12 bg-muted/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 font-semibold bg-accent hover:bg-accent/90 text-white" disabled={isPending}>
                      {isPending ? "Sending..." : "Download Now"}
                    </Button>
                  </form>
                </Form>
                
                <p className="text-xs text-center text-muted-foreground">
                  Join 1,000+ safety professionals trusting Core Compliance.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">Everything you need for compliance</h2>
            <p className="text-lg text-muted-foreground">
              Built for safety managers, HR directors, and occupational health professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={Bot}
              title="OccHealth Consultant"
              description="Get instant answers to complex regulatory questions citing specific OSHA 1904 and DOT FMCSA codes."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="ACSI ISO Manager"
              description="Lead ISO Auditor for ISO 9001, 14001, 45001. Gap Analysis, Quality Manuals, and audit prep."
            />
            <FeatureCard 
              icon={FileText}
              title="OSHA 300, Log it or Not"
              description="Interactive Yes/No workflows to determine recordability for any workplace injury or illness."
            />
            <FeatureCard 
              icon={CheckCircle2}
              title="Audit Ready"
              description="Keep your logs and decisions documented and ready for any surprise inspection."
            />
          </div>
        </div>
      </section>

      {/* Occupational Health Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">Occupational Health Plans</h2>
            <p className="text-lg text-muted-foreground">
              OSHA recordables, DOT compliance, and drug screening guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              tier="Safety Starter"
              price="Free"
              period=""
              features={["3 Questions / month", "OSHA recordability guidance", "Basic DOT compliance help"]}
              bestFor="Small teams or one-off 'Is this a recordable?' checks."
              buttonText="Get Started"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
            />
            <PricingCard 
              tier="Compliance Pro"
              price="$29"
              period="/mo"
              features={["15 Questions / month", "PDF Compliance Checklists", "Priority response times", "DOT physical guidance"]}
              bestFor="Growing companies needing regular DOT/OSHA guidance."
              buttonText="Upgrade to Pro"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
              highlighted
            />
            <PricingCard 
              tier="Unlimited Safety"
              price="$99"
              period="/mo"
              features={["Unlimited AI Questions", "Audit Prep Tools", "Custom compliance reports", "Dedicated support"]}
              bestFor="Safety Managers handling high-risk environments or large fleets."
              buttonText="Go Unlimited"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
            />
          </div>
        </div>
      </section>

      {/* ISO Management Pricing Section */}
      <section className="py-24 bg-white border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">ISO Management Plans</h2>
            <p className="text-lg text-muted-foreground">
              ISO 9001, 14001, and 45001 certification support. Management as a Service.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              tier="ISO Essentials"
              price="$49"
              period="/mo"
              features={["5 AI Gap Analysis checks", "Procedure Templates", "ISO 9001/14001/45001 guidance"]}
              bestFor="Startups preparing for first certification."
              buttonText="Start ISO Journey"
              buttonHref={isAuthenticated ? "/iso-manager" : "/api/login"}
            />
            <PricingCard 
              tier="ISO Professional"
              price="$149"
              period="/mo"
              features={["Unlimited ISO AI guidance", "Internal Audit Checklists", "'Write-Up Free' Guarantee tools", "Quality Manual drafting"]}
              bestFor="Companies maintaining ISO 9001/14001/45001."
              buttonText="Go Professional"
              buttonHref={isAuthenticated ? "/iso-manager" : "/api/login"}
              highlighted
            />
            <PricingCard 
              tier="Integrated Enterprise"
              price="$299"
              period="/mo"
              features={["CCH + ACSI Combined", "Full Health, Safety & ISO suite", "Audit Readiness Dashboard", "Priority expert support"]}
              bestFor="Mid-sized firms with high compliance risk."
              buttonText="Enterprise Bundle"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto brightness-0 invert" />
          </div>
          <p className="text-primary-foreground/60 text-sm">
            © 2024 Core Compliance Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="p-8 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function PricingCard({ tier, price, period, features, bestFor, buttonText, buttonHref, highlighted }: {
  tier: string;
  price: string;
  period: string;
  features: string[];
  bestFor: string;
  buttonText: string;
  buttonHref: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`p-8 rounded-2xl border ${highlighted ? 'border-accent bg-accent/5 ring-2 ring-accent' : 'border-border/50 bg-white'} flex flex-col`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-primary mb-2">{tier}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-primary">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
      </div>
      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground mb-6 italic">{bestFor}</p>
      <a href={buttonHref}>
        <Button className={`w-full ${highlighted ? 'bg-accent hover:bg-accent/90' : ''}`} variant={highlighted ? 'default' : 'outline'}>
          {buttonText}
        </Button>
      </a>
    </div>
  );
}
