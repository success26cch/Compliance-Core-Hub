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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Sidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bot", label: "Expert Consultant", icon: Bot },
    { href: "/decision-tree", label: "Recordability Tree", icon: GitBranch },
  ];

  const LinkItem = ({ href, label, icon: Icon }: any) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"}
      `}>
        <Icon className="w-5 h-5" />
        {label}
      </Link>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-border/50 ${className}`}>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-primary tracking-tight">Core Compliance</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => (
          <LinkItem key={link.href} {...link} />
        ))}
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
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-bold text-primary">Core Compliance</span>
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
