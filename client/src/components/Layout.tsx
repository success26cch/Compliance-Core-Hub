import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Bot, 
  GitBranch, 
  Settings, 
  LogOut, 
  Menu,
  ShieldCheck,
  User,
  Phone,
  FileCheck,
  Shield,
  Mail,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import hubLogo from "@assets/6_1770259909295.png";

export function Sidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  
  const links = [
    { href: "/settings", label: "Company Profile", icon: Building2 },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bot", label: "OccHealth Consultant", icon: Bot },
    { href: "https://acsi-quality.com/", label: "ACSI ISO Manager", icon: FileCheck, external: true },
    { href: "/decision-tree", label: "OSHA 300, Log it or Not", icon: GitBranch },
  ];

  const LinkItem = ({ href, label, icon: Icon, external }: any) => {
    const isActive = location === href;
    const className = `
      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
      ${isActive 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"}
    `;
    
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          <Icon className="w-5 h-5" />
          {label}
        </a>
      );
    }
    
    return (
      <Link href={href} className={className}>
        <Icon className="w-5 h-5" />
        {label}
      </Link>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-border/50 ${className}`}>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-center">
          <img src={hubLogo} alt="Core Compliance Hub" className="w-full max-w-[200px] h-auto" data-testid="img-sidebar-logo" />
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <LinkItem key={link.href} {...link} />
        ))}
        
        {/* Human Expert Retainer Section */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Human Expert Retainer
          </h3>
          <Card className="p-4 bg-accent/5 border-accent/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <h4 className="font-bold text-sm text-primary">Safety Officer on Standby</h4>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary">The $0-Liability Safety Retainer</p>
                <p className="text-xs text-muted-foreground">Your AI handles the questions; we handle the emergencies.</p>
              </div>
              
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                  <span><strong>Immediate Crisis Response:</strong> 4-hour callback for workplace accidents or OSHA inspections.</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                  <span><strong>OSHA 300 Log Audit:</strong> We review your year-end records to ensure 100% accuracy before you submit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                  <span><strong>Audit Defense:</strong> If you get a DOT or OSHA audit letter, we sit at the table with you.</span>
                </li>
              </ul>
              
              <a href="mailto:retainer@corecompliancehub.com?subject=Retainer%20Inquiry" data-testid="button-inquire-retainer">
                <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-xs">
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Inquire About Retainer
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>

      <div className="p-4 border-t border-border/50 space-y-2">
        <Link href="/settings" className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
          text-muted-foreground hover:bg-muted hover:text-foreground transition-colors
        `}>
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex w-64 fixed inset-y-0" />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center">
            <img src={hubLogo} alt="Core Compliance Hub" className="h-10 w-auto" />
          </div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary font-display">
                  {/* Dynamic Title based on route could go here */}
                  Welcome back, {user?.firstName || 'User'}
                </h1>
                <p className="text-muted-foreground mt-1">Here's your compliance overview.</p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.firstName?.[0] || <User className="w-5 h-5" />}
                </div>
              </div>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
