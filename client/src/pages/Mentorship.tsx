import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, ArrowRight, Users, Target, Shield, 
  TrendingUp, Award, BookOpen, MessageSquare, Calendar,
  Briefcase, GraduationCap, ClipboardCheck, ShoppingCart
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { PRODUCTS } from "@/lib/products";
import { CartTrigger } from "@/components/CartDrawer";
import logoUrl from "@assets/1_1767636977932.png";
import mentorshipLogo from "@assets/tree.transp_1768928785893.png";

export default function Mentorship() {
  const { isAuthenticated } = useAuth();
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

  const benefits = [
    {
      icon: Target,
      title: "Implement & Maintain Effectively",
      description: "Get ongoing support to implement and maintain your management system with confidence and consistency."
    },
    {
      icon: TrendingUp,
      title: "Improve Audit Consistency",
      description: "Build better follow-through between audits with reinforced practices and regular check-ins."
    },
    {
      icon: Shield,
      title: "Audit-Ready Confidence",
      description: "Develop the confidence to handle audit-facing roles and discussions with expert backing."
    },
    {
      icon: Briefcase,
      title: "Reduce Reactive Consulting",
      description: "Strengthen internal capability so you rely less on expensive, last-minute consulting."
    },
    {
      icon: BookOpen,
      title: "Practical Application Support",
      description: "Move beyond theory with hands-on guidance tailored to your real-world challenges."
    },
    {
      icon: Award,
      title: "Long-Term Sustainability",
      description: "Build systems that last with sustainable practices across ISO 9001, IATF 16949, ISO 14001, and more."
    }
  ];

  const standards = [
    { name: "ISO 9001", description: "Quality Management Systems" },
    { name: "IATF 16949", description: "Automotive Quality Management" },
    { name: "ISO 14001", description: "Environmental Management" },
    { name: "ISO 45001", description: "Occupational Health & Safety" },
  ];

  const programFeatures = [
    {
      icon: MessageSquare,
      title: "Ongoing Guidance",
      description: "Regular mentorship sessions with experienced ISO auditors who understand real-world challenges."
    },
    {
      icon: Calendar,
      title: "Scheduled Check-ins",
      description: "Consistent touchpoints to reinforce learning, address questions, and track progress."
    },
    {
      icon: ClipboardCheck,
      title: "Competency Development",
      description: "Structured skill-building focused on the specific needs of system owners and internal auditors."
    },
    {
      icon: Users,
      title: "Expert Mentors",
      description: "Learn from auditors with years of real-world experience across multiple industries."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <Link href="/">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto cursor-pointer" data-testid="img-nav-logo" />
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-home">Home</Link>
            <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-iso">ISO Manager</a>
            <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-brandnswag">BrandNSwag</a>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button data-testid="button-nav-dashboard">Go to Dashboard</Button>
              </Link>
            ) : (
              <a href="/api/login">
                <Button variant="outline" data-testid="button-nav-signin">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>
      
      <div className="flex-1">
        <section className="pt-12 pb-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <Badge variant="secondary" className="text-sm px-4 py-1" data-testid="badge-exclusive">
                <Award className="w-4 h-4 mr-2" />
                CCH Exclusive - First of Its Kind
              </Badge>
              <img src={mentorshipLogo} alt="ACSI Mentorship" className="h-32 md:h-40 w-auto mx-auto" data-testid="img-mentorship-hero-logo" />
              <h1 className="text-4xl md:text-5xl font-display font-bold text-primary">
                The 1st ISO Mentorship Program
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ongoing guidance and competency development for internal system owners.
                <span className="block mt-2 font-semibold text-accent">Only available through CCH.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                  <Button size="lg" data-testid="button-mentorship-enroll">
                    Enroll in Mentorship Program
                    <GraduationCap className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <Link href="/#pricing">
                  <Button size="lg" variant="outline" data-testid="button-mentorship-pricing">
                    View Pricing Options
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="text-sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Why Mentorship?
                </Badge>
                <h2 className="text-3xl font-display font-bold text-primary">
                  Beyond One-Time Training
                </h2>
                <p className="text-lg text-muted-foreground">
                  ACSI's ISO Mentorship Program was developed from years of real-world audit experience 
                  and is designed to support the individuals responsible for managing ISO-based management 
                  systems — including Quality, Environmental, and Safety programs.
                </p>
                <p className="text-lg text-muted-foreground">
                  Rather than relying on one-time training sessions, the program provides 
                  <span className="font-semibold text-primary"> ongoing guidance, reinforcement, and 
                  practical application support</span> to help internal system owners succeed long-term.
                </p>
                <div className="pt-4">
                  <Card className="p-6 bg-accent/5 border-accent/20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary mb-1">Save Thousands</h4>
                        <p className="text-sm text-muted-foreground">
                          Our cost-effective program equips your employees with expert training and hands-on 
                          support—reducing expensive reactive consulting and preventing costly compliance issues.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {standards.map((standard, index) => (
                  <Card key={index} className="p-6 text-center" data-testid={`card-standard-${index}`}>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-primary mb-1">{standard.name}</h4>
                    <p className="text-sm text-muted-foreground">{standard.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                How the Program Helps You
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our mentorship approach strengthens internal capability and supports long-term system sustainability.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-6" data-testid={`card-benefit-${index}`}>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-primary mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="text-sm mb-4">
                <Users className="w-4 h-4 mr-2" />
                Program Features
              </Badge>
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                What's Included
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive support designed for system owners and internal auditors.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {programFeatures.map((feature, index) => (
                <div key={index} className="flex gap-4" data-testid={`feature-${index}`}>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Who Is This For?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 text-center" data-testid="card-audience-1">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-bold text-primary mb-2">Quality Managers</h3>
                <p className="text-sm text-muted-foreground">
                  Responsible for maintaining ISO 9001 and IATF 16949 quality systems.
                </p>
              </Card>
              <Card className="p-6 text-center" data-testid="card-audience-2">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-primary mb-2">EHS Coordinators</h3>
                <p className="text-sm text-muted-foreground">
                  Managing Environmental and Safety programs under ISO 14001/45001.
                </p>
              </Card>
              <Card className="p-6 text-center" data-testid="card-audience-3">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-bold text-primary mb-2">Internal Auditors</h3>
                <p className="text-sm text-muted-foreground">
                  Team members conducting internal audits who need expert guidance.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="text-sm mb-4">
                <Award className="w-4 h-4 mr-2" />
                High-Impact Investment
              </Badge>
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Mentorship Program Tiers
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the level of mentorship that fits your organization's needs. Both tiers include a 12-week intensive program.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-8 flex flex-col" data-testid="card-mentorship-foundation">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-primary mb-2">Foundation Tier</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">$2,500</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">12-week intensive program</p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {[
                    "Weekly 1-on-1 mentorship sessions",
                    "Gap analysis review for one standard",
                    "Internal audit preparation coaching",
                    "Document review and feedback",
                    "Email support between sessions",
                    "Certificate of completion",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mb-6 italic">For individual system owners or internal auditors preparing for their first ISO audit.</p>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => handleAddToCart("mentorship-foundation")} data-testid="button-add-cart-mentorship-foundation">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart — $2,500
                  </Button>
                  <Link href="/contact">
                    <Button className="w-full" variant="outline" data-testid="button-mentorship-foundation">
                      Apply for Foundation Tier
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-8 flex flex-col ring-2 ring-accent" data-testid="card-mentorship-executive">
                <Badge className="mb-4 self-start">Recommended</Badge>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-primary mb-2">Executive Tier</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">$5,000</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">12-week intensive + ongoing support</p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {[
                    "Everything in Foundation Tier",
                    "Multi-standard coverage (9001, 14001, 45001, IATF 16949)",
                    "Mock audit simulation with detailed findings report",
                    "Management review preparation and coaching",
                    "Priority direct access to Lead Auditor mentor",
                    "3 months of post-program follow-up support",
                    "Custom procedure templates for your organization",
                    "Audit defense preparation",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mb-6 italic">For organizations serious about audit readiness and long-term compliance sustainability.</p>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => handleAddToCart("mentorship-executive")} data-testid="button-add-cart-mentorship-executive">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart — $5,000
                  </Button>
                  <Link href="/contact">
                    <Button className="w-full" variant="outline" data-testid="button-mentorship-executive">
                      Apply for Executive Tier
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block bg-white/10 text-white text-xl md:text-2xl font-bold px-8 py-4 tracking-wide uppercase mb-6 rounded-lg">
              CCH Exclusive Program
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">
              Be Among the First to Join
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              The only ISO mentorship program of its kind. Act now before compliance issues cost you thousands.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                <Button size="lg" variant="secondary" data-testid="button-mentorship-cta-enroll">
                  Start Your Mentorship Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <Link href="/">
                <Button size="lg" variant="outline" data-testid="button-mentorship-cta-explore">
                  Explore All CCH Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
