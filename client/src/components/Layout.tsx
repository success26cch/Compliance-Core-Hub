import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
  Building2,
  Crown,
  Bell,
  Users,
  QrCode,
  MessageSquare,
  ClipboardCheck,
  FileText,
  BookOpen,
  Sun,
  Moon,
  ArrowLeftRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useAdminView } from "@/hooks/use-admin-view";
import hubLogo from "@assets/6_1770259909295.png";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      data-testid="button-theme-toggle"
    >
      <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function ViewModeToggle() {
  const { viewMode, setViewMode } = useAdminView();
  const isAdmin = viewMode === "admin";

  return (
    <button
      onClick={() => setViewMode(isAdmin ? "test-company" : "admin")}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${isAdmin
          ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
          : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"}
      `}
      data-testid="button-toggle-view-mode"
    >
      <ArrowLeftRight className="w-5 h-5" />
      {isAdmin ? "Switch to Test Co." : "Switch to Admin"}
    </button>
  );
}

export function ViewModeBadge() {
  const { viewMode } = useAdminView();
  const { data: superadminCheck } = useQuery<{ isSuperadmin: boolean }>({
    queryKey: ['/api/superadmin/check'],
  });

  if (!superadminCheck?.isSuperadmin) return null;

  const isAdmin = viewMode === "admin";

  return (
    <Badge
      className={`
        gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider cursor-default select-none
        ${isAdmin
          ? "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400 dark:border-red-400/30"
          : "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400 dark:border-blue-400/30"}
      `}
      variant="outline"
      data-testid="badge-view-mode"
    >
      {isAdmin ? (
        <>
          <Crown className="w-3.5 h-3.5" />
          ADMIN
        </>
      ) : (
        <>
          <Building2 className="w-3.5 h-3.5" />
          TEST COMPANY
        </>
      )}
    </Badge>
  );
}

export function Sidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  
  const { data: superadminCheck } = useQuery<{ isSuperadmin: boolean }>({
    queryKey: ['/api/superadmin/check'],
  });
  
  const utilityLinks = [
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/company-profile", label: "Company Profile", icon: Building2 },
  ];

  const safetyLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/corey", label: "Ask Corey", icon: Bot },
    { href: "/team-seats", label: "Team Seats", icon: Users },
    { href: "/decision-tree", label: "OSHA 300, Log it or Not", icon: GitBranch },
    { href: "/compliance-checklists", label: "Compliance Checklists", icon: FileText },
    { href: "/audit-prep", label: "Audit Prep Tools", icon: ClipboardCheck },
    { href: "/compliance-glossary", label: "Compliance Glossary", icon: BookOpen },
    { href: "/dot-notifications", label: "DOT Notifications", icon: Bell },
    { href: "/employee-passport", label: "Medical Passport", icon: QrCode },
  ];

  const isoLinks = [
    { href: "/iso-manager", label: "ACSI ISO Manager", icon: FileCheck },
  ];

  const LinkItem = ({ href, label, icon: Icon, external }: any) => {
    const isActive = location === href;
    const testId = `link-sidebar-${label.toLowerCase().replace(/[\s,&]+/g, '-')}`;
    const className = `
      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
      ${isActive 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"}
    `;
    
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
          <Icon className="w-5 h-5" />
          {label}
        </a>
      );
    }
    
    return (
      <Link href={href} className={className} data-testid={testId}>
        <Icon className="w-5 h-5" />
        {label}
      </Link>
    );
  };

  const SectionLabel = ({ label, accent = false }: { label: string; accent?: boolean }) => (
    <div className="pt-3 pb-1">
      <div className={`flex items-center gap-2 px-1`}>
        <div className={`h-px flex-1 ${accent ? "bg-accent/30" : "bg-border/60"}`} />
        <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${accent ? "text-accent" : "text-muted-foreground/60"}`}>
          {label}
        </span>
        <div className={`h-px flex-1 ${accent ? "bg-accent/30" : "bg-border/60"}`} />
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-card border-r border-border/50 ${className}`}>
      <div className="px-4 py-2 border-b border-border/50">
        <Link href="/">
          <div className="flex items-center justify-center overflow-hidden h-16 cursor-pointer" data-testid="link-home-logo">
            <img src={hubLogo} alt="Core Compliance Hub" className="w-full max-w-[220px] h-auto scale-[0.85]" data-testid="img-sidebar-logo" />
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Utility links */}
        <div className="space-y-1 mb-1">
          {utilityLinks.map((link) => (
            <LinkItem key={link.href} {...link} />
          ))}
        </div>

        {/* Safety & Occ Med section */}
        <SectionLabel label="Safety & Occ Med" />
        <div className="space-y-1">
          {safetyLinks.map((link) => (
            <LinkItem key={link.href} {...link} />
          ))}
        </div>

        {/* ACSI ISO Manager section */}
        <SectionLabel label="ACSI ISO Manager" accent />
        <div className="space-y-1 mb-2">
          {isoLinks.map((link) => (
            <LinkItem key={link.href} {...link} />
          ))}
        </div>

        {/* Contact */}
        <div className="space-y-1 pt-2 border-t border-border/40">
          <LinkItem href="/contact" label="Contact Us" icon={MessageSquare} />
        </div>
      </div>

      <div className="p-4 border-t border-border/50 space-y-2">
        {superadminCheck?.isSuperadmin && (
          <>
            <ViewModeToggle />
            <Link href="/superadmin" className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${location === '/superadmin' 
                ? "bg-red-100 text-red-700" 
                : "text-red-600 hover:bg-red-50 hover:text-red-700"}
              transition-colors
            `} data-testid="link-superadmin">
              <Crown className="w-5 h-5" />
              Super Admin
            </Link>
            <Link href="/leads" className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${location === '/leads' 
                ? "bg-red-100 text-red-700" 
                : "text-red-600 hover:bg-red-50 hover:text-red-700"}
              transition-colors
            `} data-testid="link-leads-admin">
              <Users className="w-5 h-5" />
              Leads Admin
            </Link>
          </>
        )}
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
        <header className="md:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <Link href="/">
            <div className="flex items-center cursor-pointer" data-testid="link-mobile-home-logo">
              <img src={hubLogo} alt="Core Compliance Hub" className="h-10 w-auto" />
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ViewModeBadge />
            <ThemeToggle />
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
          </div>
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
                <ViewModeBadge />
                <ThemeToggle />
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
