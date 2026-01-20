import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, Building2, Users, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/1_1767636977932.png";

type ContactInquiry = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  employeeCount: string | null;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
};

const inquiryTypeLabels: Record<string, string> = {
  retainer: "Human Expert Retainer",
  consultation: "One-Time Consultation",
  training: "Training Inquiry",
  mentorship: "ACSI Mentorship",
  general: "General Question",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  closed: { label: "Closed", variant: "outline" },
};

export default function AdminInquiries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiries, isLoading, error } = useQuery<ContactInquiry[]>({
    queryKey: ["/api/contact-inquiries"],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/contact-inquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-inquiries"] });
      toast({
        title: "Status Updated",
        description: "Inquiry status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-primary">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view this page. Admin access required.</p>
            <Link href="/">
              <Button data-testid="button-back-home">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-12 w-auto cursor-pointer" data-testid="img-logo" />
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">Contact Inquiries</h1>
            <p className="text-muted-foreground">Manage retainer and consultation requests</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {inquiries?.length || 0} Total
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : inquiries?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">No inquiries yet</h3>
              <p className="text-muted-foreground">Contact form submissions will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inquiries?.map((inquiry) => (
              <Card key={inquiry.id} className={inquiry.status === "new" ? "border-accent/50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {inquiry.name}
                        <Badge variant={statusConfig[inquiry.status]?.variant || "secondary"}>
                          {statusConfig[inquiry.status]?.label || inquiry.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {inquiry.email}
                        </span>
                        {inquiry.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {inquiry.phone}
                          </span>
                        )}
                        {inquiry.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {inquiry.company}
                          </span>
                        )}
                        {inquiry.employeeCount && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {inquiry.employeeCount}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={inquiry.status}
                        onValueChange={(status) => updateStatus.mutate({ id: inquiry.id, status })}
                      >
                        <SelectTrigger className="w-[140px]" data-testid={`select-status-${inquiry.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {inquiryTypeLabels[inquiry.inquiryType] || inquiry.inquiryType}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(inquiry.createdAt).toLocaleDateString()} at{" "}
                      {new Date(inquiry.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {inquiry.message}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <a href={`mailto:${inquiry.email}`}>
                      <Button size="sm" variant="outline" data-testid={`button-email-${inquiry.id}`}>
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                    </a>
                    {inquiry.phone && (
                      <a href={`tel:${inquiry.phone}`}>
                        <Button size="sm" variant="outline" data-testid={`button-call-${inquiry.id}`}>
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
