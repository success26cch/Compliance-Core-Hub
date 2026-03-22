import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, QrCode, Shirt, Trophy, Star, Package, Sparkles, Users, 
  CheckCircle2, ArrowRight, ShoppingBag, Palette, Boxes, ScanLine,
  Calendar, UserPlus, Shield, GraduationCap, ShoppingCart
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { PRODUCTS } from "@/lib/products";
import { CartTrigger } from "@/components/CartDrawer";
import logoUrl from "@assets/1_1767636977932.png";
import brandNSwagLogo from "@assets/2026_BNS_Logo_1768928815681.png";

export default function BrandNSwag() {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const handleAddToCart = () => {
    const product = PRODUCTS["brandnswag-platform"];
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

  const swagItems = [
    { name: "Hoodies", icon: Shirt, description: "Premium embroidered company hoodies" },
    { name: "T-Shirts", icon: Shirt, description: "Comfortable branded tees for daily wear" },
    { name: "Hats & Caps", icon: Package, description: "Embroidered caps and beanies" },
    { name: "Jackets", icon: Shirt, description: "Weather-ready branded outerwear" },
    { name: "Drinkware", icon: Package, description: "Mugs, tumblers, and water bottles" },
    { name: "Tech Gear", icon: Package, description: "Branded chargers, bags, and accessories" },
  ];

  const rewardTriggers = [
    { 
      icon: UserPlus, 
      title: "Onboarding Complete", 
      description: "New hires receive welcome swag boxes",
      points: "500 pts"
    },
    { 
      icon: GraduationCap, 
      title: "Safety Training Passed", 
      description: "Reward for completing safety courses",
      points: "250 pts"
    },
    { 
      icon: Calendar, 
      title: "Perfect Attendance", 
      description: "Monthly attendance bonuses",
      points: "100 pts"
    },
    { 
      icon: Users, 
      title: "Friend Referral", 
      description: "Earn when referrals get hired",
      points: "1000 pts"
    },
    { 
      icon: Trophy, 
      title: "Safety Milestones", 
      description: "Days without incidents",
      points: "500 pts"
    },
    { 
      icon: Star, 
      title: "Peer Recognition", 
      description: "QR scans from coworkers",
      points: "50 pts"
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <Link href="/">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto cursor-pointer" />
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-home">Home</Link>
            <Link href="/#features" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-features">Features</Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-pricing">Pricing</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button data-testid="button-nav-dashboard">Go to Dashboard</Button>
              </Link>
            ) : (
              <a href="/login">
                <Button variant="outline" data-testid="button-nav-signin">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>
      
      <div className="flex-1">
        <section className="pt-12 pb-20 bg-gradient-to-br from-accent/10 via-background to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <Badge variant="secondary" className="text-sm px-4 py-1" data-testid="badge-brandnswag-division">
                <Sparkles className="w-4 h-4 mr-2" />
                A CCHUB Division
              </Badge>
              <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer" className="inline-block cursor-pointer">
                <img src={brandNSwagLogo} alt="BrandNSwag" className="h-24 md:h-32 w-auto mx-auto hover:opacity-80 transition-opacity" data-testid="img-brandnswag-logo" />
              </a>
              <p className="text-2xl text-muted-foreground">
                Make Safety <span className="font-semibold text-accent">Fun & Rewarding</span>
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Smart Swag transforms your company merchandise into a powerful employee engagement engine. 
                Every item comes with a QR code that connects to your recognition system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" data-testid="button-brandnswag-setup-store">
                    Set Up Your Swag Store
                    <ShoppingBag className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <Link href="/">
                  <Button size="lg" variant="outline" data-testid="button-brandnswag-back-home">
                    Back to CCHUB Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                How Smart Swag Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From setup to recognition, we make employee rewards effortless.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-accent" />
                </div>
                <div className="text-sm font-bold text-accent mb-2">Step 1</div>
                <h3 className="font-bold text-primary mb-2">Design Your Store</h3>
                <p className="text-sm text-muted-foreground">We create a custom swag store with your branding and merchandise selection.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">Step 2</div>
                <h3 className="font-bold text-primary mb-2">QR Code Integration</h3>
                <p className="text-sm text-muted-foreground">Every piece of swag gets a unique QR code linked to the employee and your HR system.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ScanLine className="w-8 h-8 text-accent" />
                </div>
                <div className="text-sm font-bold text-accent mb-2">Step 3</div>
                <h3 className="font-bold text-primary mb-2">Scan & Recognize</h3>
                <p className="text-sm text-muted-foreground">Anyone can scan a QR code to give recognition points—managers, peers, or customers.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">Step 4</div>
                <h3 className="font-bold text-primary mb-2">Redeem Rewards</h3>
                <p className="text-sm text-muted-foreground">Employees use points to pick new swag from your store—creating a virtuous cycle.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Reward Triggers
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Automatically award points for the behaviors that matter most to your organization.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewardTriggers.map((trigger, index) => (
                <Card key={index} className="p-6" data-testid={`card-reward-trigger-${index}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <trigger.icon className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-primary">{trigger.title}</h3>
                        <Badge variant="outline" className="text-xs">{trigger.points}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{trigger.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Swag Catalog
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Quality merchandise your employees will actually want to wear.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swagItems.map((item, index) => (
                <Card key={index} className="p-6 text-center" data-testid={`card-swag-item-${index}`}>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-primary mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="text-sm">
                  <Boxes className="w-4 h-4 mr-2" />
                  Onboarding Kits
                </Badge>
                <h2 className="text-3xl font-display font-bold text-primary">
                  Welcome New Hires Right
                </h2>
                <p className="text-lg text-muted-foreground">
                  First impressions matter. Our curated Swag Boxes give new employees an immediate sense of belonging 
                  and pride in their new company.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Custom-branded packaging with your company logo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">QR-enabled items for immediate recognition eligibility</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Welcome card with instructions to start earning points</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Size selection during onboarding process</span>
                  </li>
                </ul>
              </div>
              <Card className="p-8 text-center" data-testid="card-swag-box-tiers">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">Swag Box Tiers</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="font-semibold text-primary">Starter Box</div>
                    <div className="text-sm text-muted-foreground">T-shirt + Cap + Welcome Card</div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <div className="font-semibold text-accent">Professional Box</div>
                    <div className="text-sm text-muted-foreground">Hoodie + T-shirt + Cap + Tumbler + Badge</div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10">
                    <div className="font-semibold text-primary">Executive Box</div>
                    <div className="text-sm text-muted-foreground">Full wardrobe + Tech gear + Premium packaging</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Recognition Platform Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Keep your QR recognition system running with a simple monthly platform fee.
              </p>
            </div>

            <Card className="p-8 max-w-lg mx-auto text-center ring-2 ring-accent" data-testid="card-brandnswag-platform-pricing">
              <Badge className="mb-4">Recognition Platform</Badge>
              <h3 className="text-2xl font-bold text-primary mb-2">QR Recognition Platform</h3>
              <p className="text-muted-foreground mb-6">Keeps your points system and QR scanning active</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">$49</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                {[
                  "Active QR code recognition system",
                  "Points tracking and leaderboards",
                  "Employee reward triggers",
                  "Peer-to-peer recognition scanning",
                  "Monthly engagement reports",
                  "Swag store management",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mb-6 italic">
                Swag boxes and merchandise purchased separately. Platform fee ensures recurring revenue for your recognition program.
              </p>
              <div className="space-y-2">
                <Button size="lg" className="w-full" onClick={handleAddToCart} data-testid="button-add-cart-brandnswag-platform">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart — $49/mo
                </Button>
                <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full" data-testid="button-brandnswag-platform-subscribe">
                    Visit BrandNSwag.com
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block bg-white/10 text-white text-xl md:text-2xl font-bold px-8 py-4 tracking-wide uppercase mb-6 rounded-lg">
              CCHUB: The One Stop Employer Shop
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">
              Ready to Transform Your Employee Recognition?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              From compliance to engagement—CCHUB has everything your workforce needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" data-testid="button-brandnswag-cta-start">
                  Get Started with BrandNSwag
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <Link href="/">
                <Button size="lg" variant="outline" data-testid="button-brandnswag-cta-explore">
                  Explore All CCHUB Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
