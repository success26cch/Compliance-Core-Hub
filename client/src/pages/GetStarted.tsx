import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, Bot, ArrowRight, ShoppingCart, Building2, Stethoscope, Award, GraduationCap, Users, Sparkles, ArrowLeft, Check, X, BarChart3, AlertTriangle, ClipboardList, FileText, Ambulance, Syringe, Bell, Globe } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { PRODUCTS } from "@/lib/products";
import { CartTrigger } from "@/components/CartDrawer";
import logoUrl from "@assets/1_1770683748423.png";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import coreyImg from "@assets/6_1771806567979.png";

export default function GetStarted() {
  const { addItem } = useCart();

  const handleAddToCart = (productId: string) => {
    const product = PRODUCTS[productId];
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        unitAmount: product.unitAmount,
        currency: product.currency,
        interval: product.interval,
        category: product.category,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home-logo">
              <img src={logoUrl} alt="CCHUB" className="h-10 w-auto" />
              <span className="text-lg font-bold text-primary hidden sm:block">Core Compliance Hub</span>
            </div>
          </Link>
          <CartTrigger />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4" data-testid="text-page-title">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground">
            Pick the services that fit your company. Add them to your cart and check out when you're ready.
          </p>
        </div>

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary" data-testid="text-section-corey">Ask Corey AI — Occupational Health & Safety</h2>
              <p className="text-sm text-muted-foreground">Your AI safety compliance expert, powered by deep regulatory knowledge</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="flex flex-col border-accent ring-2 ring-accent" data-testid="card-plan-unlimited">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Unlimited Corey</CardTitle>
                  <Badge className="bg-accent text-white">Most Popular</Badge>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-primary">$199</span>
                  <span className="text-muted-foreground">/mo per user</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {[
                    "Unlimited Corey Interactions",
                    "Compliance Checklist Library (downloadable PDFs)",
                    "Interactive Audit Prep Tools with progress tracking",
                    "DOT physical & drug testing guidance",
                    "Workers' comp documentation help",
                    "Custom compliance reports",
                    "Priority response times",
                    "Dedicated support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground italic mb-4">Best for Safety Managers, growing companies, and large fleets.</p>
                <Button className="w-full" onClick={() => handleAddToCart("cch-unlimited-safety")} data-testid="button-add-cart-unlimited">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart — $199/mo
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary" data-testid="text-section-employer">Employer Compliance Platform</h2>
              <p className="text-sm text-muted-foreground">Full compliance management: dashboard, employees, incidents, OSHA 300, Medical Passport & more</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="flex flex-col border-accent ring-2 ring-accent" data-testid="card-plan-employer-platform">
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 className="w-6 h-6 text-accent" />
                  <CardTitle className="text-xl">Complete Compliance Platform</CardTitle>
                </div>
                <Badge className="bg-accent text-white w-fit mx-auto">One Platform. Everything Included.</Badge>
                <div className="mt-4">
                  <span className="text-lg font-semibold text-muted-foreground">Contact us for pricing</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pricing is tailored to your team size — schedule a demo and we'll walk you through the right plan.</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 mb-6">
                  <div>
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Health & Safety</h4>
                    <ul className="space-y-2 mb-5">
                      {["Compliance Dashboard with real-time metrics", "Employee tracking & medical surveillance", "OSHA 300 logging & incident management", "DOT notifications & drug testing tools", "Medical Passport with QR check-in", "Corrective Action Plans (CAPA)"].map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4 mb-4">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Also Included</h4>
                  <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                    {["Compliance Glossary (OSHA & DOT)", "Audit Prep Checklists", "Priority expert support"].map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border/50 pt-4 mb-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <img src={coreyImg} alt="Corey AI Assistant" className="w-48 h-48 object-contain flex-shrink-0" data-testid="img-corey-employer-card" />
                    <div>
                      <h4 className="text-sm font-bold text-primary">Corey AI available as an add-on</h4>
                      <p className="text-xs text-muted-foreground mt-1">Add Corey AI to your platform subscription — or subscribe to Corey standalone at $199/mo per user. Contact us to discuss the right bundle.</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic mb-4 text-center">For companies serious about compliance — from startups to mid-sized firms.</p>
                <a href="mailto:team@corecompliancehub.com?subject=Employer Platform Demo Request" className="block w-full">
                  <Button className="w-full" size="lg" data-testid="button-add-cart-employer-platform-corey">
                    Schedule a Demo
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary" data-testid="text-section-specialized">Specialized Services</h2>
              <p className="text-sm text-muted-foreground">Add-on services to expand your compliance and engagement capabilities</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="flex flex-col" data-testid="card-plan-bma">
              <CardHeader className="pb-3">
                <Badge variant="secondary" className="w-fit">Clinic Tool</Badge>
                <CardTitle className="text-lg mt-2">Spanish Bilingual Medical Assistant</CardTitle>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-primary">$199</span>
                  <span className="text-sm text-muted-foreground">/mo per location</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 mb-4 flex-1">
                  {["Unlimited Spanish bilingual translations", "Clinical commands in Spanish", "Body map injury reporting", "Printable clinical summaries"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => handleAddToCart("bma-subscription")} data-testid="button-add-cart-bma">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col" data-testid="card-plan-mentorship">
              <CardHeader className="pb-3">
                <Badge className="w-fit">CCHUB Exclusive</Badge>
                <CardTitle className="text-lg mt-2">ACSI Mentorship</CardTitle>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-primary">From $2,500</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 mb-4 flex-1">
                  {["12-week intensive program", "1-on-1 Lead Auditor mentoring", "Foundation ($2,500) or Executive ($5,000)", "Mock audit simulation (Executive)"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => handleAddToCart("mentorship-foundation")} data-testid="button-add-cart-mentorship-foundation">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Foundation — $2,500
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => handleAddToCart("mentorship-executive")} data-testid="button-add-cart-mentorship-executive">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Executive — $5,000
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col" data-testid="card-plan-brandnswag">
              <CardHeader className="pb-3">
                <Badge variant="secondary" className="w-fit">Recognition</Badge>
                <CardTitle className="text-lg mt-2">BrandNSwag Platform</CardTitle>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-primary">$49</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 mb-4 flex-1">
                  {["QR code recognition system", "Points tracking & leaderboards", "Employee reward triggers", "Monthly engagement reports"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => handleAddToCart("brandnswag-platform")} data-testid="button-add-cart-brandnswag">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart — $49/mo
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary" data-testid="text-section-training">Professional Training Courses</h2>
              <p className="text-sm text-muted-foreground">One-time purchase courses with video modules, quizzes, and certificates</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
            {[
              { id: "course-dot-medical", name: "DOT Medical Certification", price: "$199", desc: "Become certified in DOT physical exam requirements and protocols" },
              { id: "course-osha-surveillance", name: "OSHA Medical Surveillance", price: "$249", desc: "Comprehensive training on medical surveillance programs and compliance" },
              { id: "course-drug-alcohol", name: "Drug & Alcohol Testing", price: "$199", desc: "Master DOT-compliant drug and alcohol testing procedures" },
              { id: "course-osha-recordkeeping", name: "OSHA Recordkeeping Master", price: "$299", desc: "Deep dive into OSHA 300 logs, recordability rules, and compliance" },
              { id: "course-complete-bundle", name: "Complete Training Bundle", desc: "Custom-built bundle pricing tailored to your team's size and training needs. Contact us for a consultation.", highlighted: true, isBundle: true },
            ].map((course: any) => (
              <Card key={course.id} className={`flex flex-col ${course.highlighted ? 'border-accent ring-2 ring-accent' : ''}`} data-testid={`card-${course.id}`}>
                <CardHeader className="pb-3">
                  {course.highlighted && <Badge className="bg-accent text-white w-fit mb-1">Best Value</Badge>}
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  {course.isBundle ? (
                    <p className="text-sm font-semibold text-accent mt-1">Custom pricing — consultation required</p>
                  ) : (
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-primary">{course.price}</span>
                      <span className="text-sm text-muted-foreground">one-time</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{course.desc}</p>
                  {course.isBundle ? (
                    <Link href="/contact">
                      <Button className="w-full" data-testid={`button-contact-bundle`}>
                        Request a Consultation
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" variant="outline" onClick={() => handleAddToCart(course.id)} data-testid={`button-add-cart-${course.id}`}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart — {course.price}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16" data-testid="section-compare-plans">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary" data-testid="text-section-compare">Compare Plans</h2>
              <p className="text-sm text-muted-foreground">See all features side by side to find the right fit</p>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[640px] border-collapse" data-testid="table-compare-plans">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="text-left p-4 bg-muted/50 dark:bg-muted/20 rounded-tl-md font-semibold text-foreground" data-testid="th-feature">Feature</th>
                  <th className="text-center p-4 bg-accent/10 dark:bg-accent/20 border-x-2 border-accent font-semibold text-foreground" data-testid="th-corey-ai">
                    <div className="flex flex-col items-center gap-1">
                      <Badge className="bg-accent text-white">Most Popular</Badge>
                      <span>Corey AI</span>
                      <span className="text-lg font-bold text-primary">$199<span className="text-xs font-normal text-muted-foreground">/mo per user</span></span>
                    </div>
                  </th>
                  <th className="text-center p-4 bg-muted/50 dark:bg-muted/20 rounded-tr-md font-semibold text-foreground" data-testid="th-employer">
                    <div className="flex flex-col items-center gap-1">
                      <span>Employer Platform</span>
                      <span className="text-lg font-bold text-primary">$599<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Corey AI Questions", corey: "Unlimited", employer: "Unlimited" },
                  { feature: "OSHA Recordability Guidance", corey: true, employer: true },
                  { feature: "Basic DOT Help", corey: true, employer: true },
                  { feature: "Compliance Checklists", corey: true, employer: true },
                  { feature: "Audit Prep & Templates", corey: true, employer: true },
                  { feature: "Workers' Comp Guidance", corey: true, employer: true },
                  { feature: "Custom Reports", corey: true, employer: true },
                  { feature: "Priority Support", corey: true, employer: true },
                  { feature: "DOT Compliance Alerts", corey: true, employer: true },
                  { feature: "Employee Management", corey: false, employer: true },
                  { feature: "OSHA 300 Log & Reporting", corey: false, employer: true },
                  { feature: "Medical Passport (CCHUB Handshake)", corey: false, employer: true },
                  { feature: "Incident Management & CAPA", corey: false, employer: true },
                  { feature: "Compliance Glossary", corey: false, employer: true },
                  { feature: "DOT Random Pool Notifications", corey: false, employer: true },
                  { feature: "Bilingual Medical Assistant", corey: false, employer: true },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-muted/20 dark:bg-muted/10" : ""} data-testid={`row-feature-${idx}`}>
                    <td className="p-4 text-sm font-medium text-foreground" data-testid={`text-feature-${idx}`}>{row.feature}</td>
                    <td className="p-4 text-center border-x-2 border-accent/30" data-testid={`cell-corey-${idx}`}>
                      {typeof row.corey === "string" ? (
                        <span className="text-sm font-medium text-accent">{row.corey}</span>
                      ) : row.corey ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center" data-testid={`cell-employer-${idx}`}>
                      {typeof row.employer === "string" ? (
                        <span className="text-sm font-medium text-accent">{row.employer}</span>
                      ) : row.employer ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="p-4"></td>
                  <td className="p-4 text-center border-x-2 border-accent/30">
                    <Button className="w-full max-w-[160px]" onClick={() => handleAddToCart("cch-unlimited-safety")} data-testid="button-compare-add-corey">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </td>
                  <td className="p-4 text-center">
                    <Button className="w-full max-w-[160px]" onClick={() => handleAddToCart("employer-platform")} data-testid="button-compare-add-employer">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="text-center py-12 border-t border-border/50">
          <h2 className="text-2xl font-bold text-primary mb-3">Need help deciding?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Not sure which plan is right for your company? Our team can help you find the perfect fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="outline" data-testid="button-contact-us">
                Contact Us
              </Button>
            </Link>
            <a href="/login">
              <Button size="lg" data-testid="button-try-corey">
                Sign In to Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
