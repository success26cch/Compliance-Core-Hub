import { ProtectedLayout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Download, Search, Mail, Calendar, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  cheat_sheet: { label: "Cheat Sheet", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  ask_corey: { label: "Ask Corey", color: "bg-accent/10 text-accent" },
  employer_dashboard: { label: "Employer Dashboard", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  dot_hub: { label: "DOT Fleet Hub", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  env_hub: { label: "Env Hub", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

function SourceBadge({ source }: { source: string | null | undefined }) {
  if (!source) return <span className="text-muted-foreground text-xs">—</span>;
  const cfg = SOURCE_LABELS[source];
  if (!cfg) return <Badge variant="secondary" className="text-xs font-mono">{source}</Badge>;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
}

export default function LeadsAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({ title: "Lead deleted", description: "The lead has been permanently removed." });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete the lead. Please try again.", variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  const filteredLeads = leads?.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.source || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportCSV = () => {
    if (!leads || leads.length === 0) return;

    const headers = ['Name', 'Email', 'Source', 'Captured Date'];
    const csvRows = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.source ? (SOURCE_LABELS[lead.source]?.label ?? lead.source) : ''}"`,
        `"${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}"`,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold font-display text-primary">Leads Management</h2>
              <p className="text-muted-foreground">Contacts captured across all CCHUB products and landing pages</p>
            </div>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={!leads || leads.length === 0}
            className="gap-2"
            data-testid="button-export-leads-csv"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{leads?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {leads?.filter(l => {
                      if (!l.createdAt) return false;
                      const date = new Date(l.createdAt);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {leads?.filter(l => {
                      if (!l.createdAt) return false;
                      const date = new Date(l.createdAt);
                      const now = new Date();
                      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      return date >= weekAgo;
                    }).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Last 7 Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>
                  Search by name, email, or source (e.g. "Cheat Sheet", "Ask Corey", "DOT")
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-leads"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No leads match your search" : "No leads captured yet"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Captured</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>
                          <SourceBadge source={lead.source} />
                        </TableCell>
                        <TableCell>
                          {lead.createdAt
                            ? new Date(lead.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                              data-testid={`button-email-lead-${lead.id}`}
                            >
                              <Mail className="w-4 h-4" />
                              Email
                            </a>
                            <button
                              onClick={() => setDeleteTarget(lead)}
                              className="inline-flex items-center gap-1 text-destructive hover:opacity-80 transition-opacity text-sm"
                              data-testid={`button-delete-lead-${lead.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) will be permanently removed.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-lead">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              data-testid="button-confirm-delete-lead"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedLayout>
  );
}
