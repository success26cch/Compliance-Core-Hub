import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, ClipboardCheck, Shield, Users, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/1_1767636977932.png";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface Resource {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  downloadUrl: string;
  category: "osha" | "dot" | "iso" | "general";
}

const resources: Resource[] = [
  {
    id: "osha-recordability",
    title: "OSHA 300 Recordability Cheat Sheet",
    description: "Stop guessing on recordability. Quick reference guide for OSHA 1904 criteria including first aid vs. medical treatment, recording triggers, and common exceptions.",
    icon: ClipboardCheck,
    downloadUrl: "/api/cheat-sheet/download",
    category: "osha",
  },
  {
    id: "dot-testing",
    title: "DOT Drug & Alcohol Testing Guide",
    description: "Complete quick reference for 49 CFR Part 40. Covers testing types, 5-panel substances, alcohol thresholds, Clearinghouse requirements, and post-accident testing decisions.",
    icon: Shield,
    downloadUrl: "/api/cheat-sheet/dot-testing",
    category: "dot",
  },
  {
    id: "iso-audit",
    title: "ISO Audit Prep Checklist",
    description: "Be audit-ready for ISO 9001, 14001, and 45001. 30-day countdown checklist, common findings to avoid, and questions auditors typically ask.",
    icon: ClipboardCheck,
    downloadUrl: "/api/cheat-sheet/iso-audit",
    category: "iso",
  },
  {
    id: "safety-manager",
    title: "New Safety Manager's First 30 Days",
    description: "Your survival guide for the first month on the job. Week-by-week action items, compliance quick checks, and key metrics to start tracking.",
    icon: Users,
    downloadUrl: "/api/cheat-sheet/safety-manager",
    category: "general",
  },
];

const categoryColors = {
  osha: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  dot: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  iso: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  general: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const categoryLabels = {
  osha: "OSHA",
  dot: "DOT",
  iso: "ISO",
  general: "Safety",
};

export default function Resources() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const createLead = useMutation({
    mutationFn: async (data: LeadFormData) => {
      return apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      if (selectedResource) {
        window.open(selectedResource.downloadUrl, "_blank");
        toast({
          title: "Download Started!",
          description: "Your cheat sheet is downloading. Check your downloads folder.",
        });
      }
      form.reset();
      setDialogOpen(false);
      setSelectedResource(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadClick = (resource: Resource) => {
    setSelectedResource(resource);
    setDialogOpen(true);
  };

  const onSubmit = (data: LeadFormData) => {
    createLead.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={logoUrl} alt="Core Compliance Hub" className="h-16 w-auto" />
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-display text-primary mb-4">
            Free Compliance Resources
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download our expert-created cheat sheets and quick reference guides. 
            No fluff, just the information you need to stay compliant.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card key={resource.id} className="hover-elevate transition-all" data-testid={`card-resource-${resource.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[resource.category]}`}>
                          {categoryLabels[resource.category]}
                        </span>
                      </div>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-3">{resource.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleDownloadClick(resource)} 
                    className="w-full"
                    data-testid={`button-download-${resource.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Free PDF
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-primary text-primary-foreground">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">Need More Than Cheat Sheets?</h3>
              <p className="mb-6 text-primary-foreground/80">
                Try our AI-powered OccHealth Consultant for instant answers to your compliance questions. 
                Free tier includes 3 questions per month.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button variant="secondary" size="lg" data-testid="button-try-ai">
                    Try the AI Consultant
                  </Button>
                </Link>
                <Link href="/#pricing">
                  <Button variant="outline" size="lg" className="bg-transparent border-white text-white" data-testid="button-view-pricing">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get Your Free Download</DialogTitle>
            <DialogDescription>
              Enter your details below to download "{selectedResource?.title}". 
              We'll also send you occasional compliance tips (you can unsubscribe anytime).
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Your name" 
                        {...field} 
                        data-testid="input-lead-name"
                      />
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
                      <Input 
                        type="email" 
                        placeholder="Work email" 
                        {...field}
                        data-testid="input-lead-email" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createLead.isPending}
                data-testid="button-submit-lead"
              >
                {createLead.isPending ? "Processing..." : "Download Now"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <footer className="border-t bg-muted/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Core Compliance Hub. All rights reserved.</p>
          <p className="mt-2">THE ONE STOP EMPLOYER SHOP</p>
        </div>
      </footer>
    </div>
  );
}
