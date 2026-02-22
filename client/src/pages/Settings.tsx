import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus, useCreateCheckoutSession } from "@/hooks/use-subscriptions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Shield, Building2, Save, User, Upload, X, Stethoscope, Clock, Phone, MapPin, FileText, Trash2, Plus, Loader2, Navigation, Users, Mail, Crown, UserPlus, UserMinus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { CompanyProfile, ClinicLocation } from "@shared/schema";

interface AuthFormMeta {
  id: number;
  visitType: string;
  formName: string;
  fileSize: number | null;
  uploadedAt: string;
}

const FORM_VISIT_TYPES = [
  { value: "general", label: "General / All Visits" },
  { value: "dot_physical", label: "DOT Physical" },
  { value: "drug_screen", label: "Drug Screen" },
  { value: "respiratory_exam", label: "Respiratory Exam" },
  { value: "injury", label: "Injury Evaluation" },
  { value: "new_hire", label: "New Hire Intake" },
  { value: "other", label: "Other Medical Visit" },
];

function AuthorizationFormsSection() {
  const { toast } = useToast();
  const formFileRef = useRef<HTMLInputElement>(null);
  const [selectedVisitType, setSelectedVisitType] = useState('');

  const { data: forms = [], isLoading } = useQuery<AuthFormMeta[]>({
    queryKey: ['/api/authorization-forms'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { visitType: string; formName: string; fileData: string; fileSize: number }) => {
      const res = await apiRequest('POST', '/api/authorization-forms', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/authorization-forms'] });
      setSelectedVisitType('');
      if (formFileRef.current) formFileRef.current.value = '';
      toast({ title: "Form Uploaded", description: "Clinic authorization form has been saved." });
    },
    onError: (err: any) => {
      toast({ title: "Upload Failed", description: err.message || "Failed to upload form.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/authorization-forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/authorization-forms'] });
      toast({ title: "Form Removed", description: "Authorization form has been deleted." });
    },
  });

  const handleFormUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedVisitType) {
      toast({ title: "Select Visit Type", description: "Please select a visit type before uploading.", variant: "destructive" });
      if (formFileRef.current) formFileRef.current.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({ title: "PDF Only", description: "Please upload a PDF file.", variant: "destructive" });
      if (formFileRef.current) formFileRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Maximum file size is 5MB.", variant: "destructive" });
      if (formFileRef.current) formFileRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      uploadMutation.mutate({
        visitType: selectedVisitType,
        formName: file.name,
        fileData: reader.result as string,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getVisitTypeLabel = (value: string) => FORM_VISIT_TYPES.find(t => t.value === value)?.label || value;

  return (
    <Card data-testid="card-authorization-forms" className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Clinic Authorization Forms
        </CardTitle>
        <CardDescription>
          Upload your clinic's authorization forms (PDF). When an employee's QR code is scanned at the clinic, the matching form will be available for download. Upload a "General" form as a default, or specific forms per visit type.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Visit Type</Label>
              <Select value={selectedVisitType} onValueChange={setSelectedVisitType}>
                <SelectTrigger data-testid="select-form-visit-type">
                  <SelectValue placeholder="Select visit type for this form" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_VISIT_TYPES.map((vt) => (
                    <SelectItem key={vt.value} value={vt.value}>
                      {vt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Upload PDF</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={formFileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFormUpload}
                  className="hidden"
                  id="form-upload"
                  data-testid="input-form-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => formFileRef.current?.click()}
                  disabled={!selectedVisitType || uploadMutation.isPending}
                  className="gap-2 w-full"
                  data-testid="button-upload-form"
                >
                  <Upload className="w-4 h-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Choose PDF File"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">PDF files up to 5MB</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No authorization forms uploaded yet. Upload a form above so clinics can access it when scanning employee QR codes.
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Uploaded Forms</Label>
            {forms.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50"
                data-testid={`form-row-${form.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{form.formName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{getVisitTypeLabel(form.visitType)}</Badge>
                      {form.fileSize && (
                        <span className="text-xs text-muted-foreground">{formatFileSize(form.fileSize)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(form.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-form-${form.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClinicLocationsSection() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formZip, setFormZip] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [geolocating, setGeolocating] = useState(false);

  const { data: locations = [], isLoading } = useQuery<ClinicLocation[]>({
    queryKey: ['/api/clinic-locations'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest('POST', '/api/clinic-locations', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clinic-locations'] });
      resetForm();
      toast({ title: "Clinic Added", description: "New clinic location has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add clinic location.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest('PATCH', `/api/clinic-locations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clinic-locations'] });
      resetForm();
      toast({ title: "Clinic Updated", description: "Clinic location has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update clinic location.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/clinic-locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clinic-locations'] });
      toast({ title: "Clinic Removed", description: "Clinic location has been deleted." });
    },
  });

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormName('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormZip('');
    setFormPhone('');
    setFormHours('');
    setFormLat('');
    setFormLng('');
  };

  const startEdit = (loc: ClinicLocation) => {
    setEditingId(loc.id);
    setShowAddForm(true);
    setFormName(loc.name);
    setFormAddress(loc.address);
    setFormCity(loc.city);
    setFormState(loc.state);
    setFormZip(loc.zipCode);
    setFormPhone(loc.phone || '');
    setFormHours(loc.hours || '');
    setFormLat(loc.latitude || '');
    setFormLng(loc.longitude || '');
  };

  const handleAutoLocate = () => {
    if (!formAddress || !formCity || !formState) {
      toast({ title: "Address Required", description: "Enter the address, city, and state first to auto-detect coordinates.", variant: "destructive" });
      return;
    }
    setGeolocating(true);
    const fullAddress = `${formAddress}, ${formCity}, ${formState} ${formZip}`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`)
      .then(r => r.json())
      .then((results: Array<{ lat: string; lon: string }>) => {
        if (results.length > 0) {
          setFormLat(results[0].lat);
          setFormLng(results[0].lon);
          toast({ title: "Coordinates Found", description: "GPS coordinates have been auto-detected from the address." });
        } else {
          toast({ title: "Not Found", description: "Could not find coordinates for this address. You can enter them manually.", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to look up coordinates.", variant: "destructive" });
      })
      .finally(() => setGeolocating(false));
  };

  const handleSave = () => {
    if (!formName || !formAddress || !formCity || !formState || !formZip) {
      toast({ title: "Missing Fields", description: "Please fill in name, address, city, state, and ZIP.", variant: "destructive" });
      return;
    }
    const data = {
      name: formName,
      address: formAddress,
      city: formCity,
      state: formState,
      zipCode: formZip,
      phone: formPhone || null,
      hours: formHours || null,
      latitude: formLat || null,
      longitude: formLng || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Clinic Locations
          </CardTitle>
          <CardDescription>
            Add clinic locations your company sends employees to. When generating a Medical Passport, you can select the specific clinic. The clinic-side page will auto-detect which location the employee is at using GPS.
          </CardDescription>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} data-testid="button-add-clinic-location">
            <Plus className="w-4 h-4 mr-2" /> Add Clinic
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="border rounded-md p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-medium">{editingId ? "Edit Clinic Location" : "Add Clinic Location"}</h4>
              <Button variant="ghost" size="icon" onClick={resetForm} data-testid="button-cancel-clinic-form">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Clinic Name</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., OccMed Connect - Southfield" data-testid="input-loc-name" />
            </div>

            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="e.g., 29255 Northwestern Hwy" data-testid="input-loc-address" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formCity} onChange={e => setFormCity(e.target.value)} placeholder="Southfield" data-testid="input-loc-city" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={formState} onChange={e => setFormState(e.target.value)} placeholder="MI" data-testid="input-loc-state" />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input value={formZip} onChange={e => setFormZip(e.target.value)} placeholder="48034" data-testid="input-loc-zip" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="(248) 555-1234" data-testid="input-loc-phone" />
              </div>
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input value={formHours} onChange={e => setFormHours(e.target.value)} placeholder="Mon-Fri 7am-5pm" data-testid="input-loc-hours" />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm text-muted-foreground">GPS Coordinates (for auto-detection at clinic)</Label>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input value={formLat} onChange={e => setFormLat(e.target.value)} placeholder="42.4734" data-testid="input-loc-lat" />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input value={formLng} onChange={e => setFormLng(e.target.value)} placeholder="-83.2220" data-testid="input-loc-lng" />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" className="w-full" onClick={handleAutoLocate} disabled={geolocating} data-testid="button-auto-locate">
                    {geolocating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                    Auto-Detect from Address
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-clinic-location">
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingId ? "Update" : "Save"} Clinic
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : locations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No clinic locations added yet. Add your company's clinic locations so employees can be directed to the right place and the system can auto-detect which clinic they arrive at.
          </p>
        ) : (
          <div className="space-y-2">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between gap-3 p-3 border rounded-md"
                data-testid={`clinic-location-${loc.id}`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.address}, {loc.city}, {loc.state} {loc.zipCode}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {loc.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{loc.phone}</span>}
                    {loc.hours && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{loc.hours}</span>}
                    {loc.latitude && loc.longitude && (
                      <Badge variant="outline" className="text-xs">GPS Ready</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(loc)} data-testid={`button-edit-clinic-${loc.id}`}>
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(loc.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-clinic-${loc.id}`}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamData {
  team: {
    id: number;
    adminUserId: string;
    companyName: string;
    totalSeats: number;
    status: string;
    stripeSubscriptionId?: string;
  };
  members: Array<{
    id: number;
    teamId: number;
    userId: string | null;
    email: string;
    name: string | null;
    role: string;
    status: string;
    invitedAt: string;
    joinedAt: string | null;
  }>;
  isAdmin: boolean;
}

function TeamManagement() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSeats, setNewTeamSeats] = useState(2);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('team_checkout') === 'success') {
      fetch('/api/team/activate', { method: 'POST', credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            toast({ title: "Team Activated!", description: "Your team subscription is now active." });
            queryClient.invalidateQueries({ queryKey: ['/api/team'] });
            queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/status'] });
          }
        })
        .catch(() => {});
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const { data: teamData, isLoading } = useQuery<TeamData | null>({
    queryKey: ['/api/team'],
    queryFn: async () => {
      const res = await fetch('/api/team', { credentials: 'include' });
      if (res.status === 401) return null;
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch team');
      return res.json();
    },
  });

  const createTeam = useMutation({
    mutationFn: async (data: { companyName: string; totalSeats: number }) => {
      const res = await apiRequest('POST', '/api/team', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      setShowCreateForm(false);
      setNewTeamName('');
      setNewTeamSeats(2);
      toast({ title: "Team Created", description: "Your team has been set up. You can now invite members." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create team.", variant: "destructive" });
    },
  });

  const inviteMember = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await apiRequest('POST', '/api/team/members', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      setInviteEmail('');
      setInviteName('');
      toast({ title: "Invite Sent", description: "Team member has been invited. Share the join link with them." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to invite member.", variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest('DELETE', `/api/team/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({ title: "Member Removed", description: "Team member has been removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to remove member.", variant: "destructive" });
    },
  });

  const updateSeats = useMutation({
    mutationFn: async (totalSeats: number) => {
      const res = await apiRequest('PATCH', '/api/team/seats', { totalSeats });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({ title: "Seats Updated", description: "Team seat count has been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update seats.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5" /> Team Seats</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (!teamData) {
    return (
      <Card className="border-2 border-dashed border-muted">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5" /> Team Seats</CardTitle>
          <CardDescription>Purchase multiple Corey seats for your team — $99/seat/month, billed together</CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">Create a team to manage multiple Corey subscriptions under one bill. Each team member gets their own private Corey access.</p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2" data-testid="button-create-team">
                <Users className="w-4 h-4" /> Create a Team
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="team-name">Company / Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Acme Safety Corp"
                  data-testid="input-team-name"
                />
              </div>
              <div>
                <Label htmlFor="team-seats">Number of Seats</Label>
                <Input
                  id="team-seats"
                  type="number"
                  min={2}
                  max={100}
                  value={newTeamSeats}
                  onChange={(e) => setNewTeamSeats(parseInt(e.target.value) || 2)}
                  data-testid="input-team-seats"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ${newTeamSeats * 99}/mo for {newTeamSeats} seats
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => createTeam.mutate({ companyName: newTeamName, totalSeats: newTeamSeats })}
                  disabled={!newTeamName || newTeamSeats < 2 || createTeam.isPending}
                  data-testid="button-confirm-create-team"
                >
                  {createTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Team
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const { team, members, isAdmin } = teamData;
  const activeMembers = members.filter(m => m.status === 'active' || m.status === 'invited');
  const seatsUsed = activeMembers.length;

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5" /> {team.companyName}
            </CardTitle>
            <CardDescription>
              {seatsUsed} of {team.totalSeats} seats used — ${team.totalSeats * 99}/mo
            </CardDescription>
          </div>
          <Badge variant={team.status === 'active' ? 'default' : 'secondary'} data-testid="badge-team-status">
            {team.status === 'active' ? 'Active' : team.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Team Members</h4>
          <div className="space-y-2">
            {members.filter(m => m.status !== 'removed').map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30" data-testid={`team-member-${member.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {member.role === 'admin' ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{member.name || member.email}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {member.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.status === 'active' ? 'default' : 'outline'} className="text-xs">
                    {member.status === 'active' ? 'Active' : member.status === 'invited' ? 'Pending' : member.status}
                  </Badge>
                  {isAdmin && member.role !== 'admin' && member.status !== 'removed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember.mutate(member.id)}
                      disabled={removeMember.isPending}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      data-testid={`button-remove-member-${member.id}`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && seatsUsed < team.totalSeats && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Invite Team Member
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="sm:w-40"
                data-testid="input-invite-name"
              />
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                data-testid="input-invite-email"
              />
              <Button
                onClick={() => inviteMember.mutate({ email: inviteEmail, name: inviteName })}
                disabled={!inviteEmail || inviteMember.isPending}
                className="gap-2"
                data-testid="button-invite-member"
              >
                {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Invite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {team.totalSeats - seatsUsed} seat(s) available. Each member gets their own private Corey access.
            </p>
          </div>
        )}

        {isAdmin && !team.stripeSubscriptionId && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Activate Team Subscription</h4>
            <p className="text-sm text-muted-foreground">Subscribe your team to Corey for ${team.totalSeats * 99}/mo ({team.totalSeats} seats × $99/seat)</p>
            <Button
              onClick={() => {
                fetch('/api/team/checkout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
                  .then(r => r.json())
                  .then(data => { if (data.url) window.location.href = data.url; else toast({ title: "Error", description: data.message, variant: "destructive" }); })
                  .catch(() => toast({ title: "Error", description: "Failed to start checkout.", variant: "destructive" }));
              }}
              className="gap-2 bg-accent hover:bg-accent/90 text-white font-bold"
              data-testid="button-team-checkout"
            >
              <Shield className="w-4 h-4" /> Subscribe Team — ${team.totalSeats * 99}/mo
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Manage Seats</h4>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSeats.mutate(team.totalSeats - 1)}
                disabled={team.totalSeats <= seatsUsed || updateSeats.isPending}
                data-testid="button-decrease-seats"
              >
                −
              </Button>
              <span className="font-semibold text-lg min-w-[3ch] text-center" data-testid="text-total-seats">{team.totalSeats}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSeats.mutate(team.totalSeats + 1)}
                disabled={updateSeats.isPending}
                data-testid="button-increase-seats"
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground">seats × $99/mo = <strong>${team.totalSeats * 99}/mo</strong></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { data: subStatus, isLoading } = useSubscriptionStatus();
  const { mutate: checkout, isPending } = useCreateCheckoutSession();
  const { toast } = useToast();

  const PRO_PRICE_ID = "price_1234567890"; 

  const handleUpgrade = () => {
    checkout(PRO_PRICE_ID);
  };

  const { data: profile, isLoading: profileLoading } = useQuery<CompanyProfile | null>({
    queryKey: ['/api/company-profile'],
  });

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [naicsCode, setNaicsCode] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [derName, setDerName] = useState('');
  const [derPhone, setDerPhone] = useState('');
  const [derEmail, setDerEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  // Clinic Management
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicState, setClinicState] = useState('');
  const [clinicZipCode, setClinicZipCode] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicHours, setClinicHours] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || '');
      setIndustry(profile.industry || '');
      setEmployeeCount(profile.employeeCount || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setZipCode(profile.zipCode || '');
      setPhone(profile.phone || '');
      setNaicsCode(profile.naicsCode || '');
      setDotNumber(profile.dotNumber || '');
      setDerName(profile.derName || '');
      setDerPhone(profile.derPhone || '');
      setDerEmail(profile.derEmail || '');
      setLogoUrl(profile.logoUrl || '');
      // Clinic fields
      setClinicName(profile.clinicName || '');
      setClinicAddress(profile.clinicAddress || '');
      setClinicCity(profile.clinicCity || '');
      setClinicState(profile.clinicState || '');
      setClinicZipCode(profile.clinicZipCode || '');
      setClinicPhone(profile.clinicPhone || '');
      setClinicHours(profile.clinicHours || '');
    }
  }, [profile]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (PNG, JPG, etc.).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveProfile = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/company-profile', {
        companyName,
        industry: industry || null,
        employeeCount: employeeCount || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        phone: phone || null,
        naicsCode: naicsCode || null,
        dotNumber: dotNumber || null,
        derName: derName || null,
        derPhone: derPhone || null,
        derEmail: derEmail || null,
        logoUrl: logoUrl || null,
        clinicName: clinicName || null,
        clinicAddress: clinicAddress || null,
        clinicCity: clinicCity || null,
        clinicState: clinicState || null,
        clinicZipCode: clinicZipCode || null,
        clinicPhone: clinicPhone || null,
        clinicHours: clinicHours || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-profile'] });
      toast({
        title: "Company Profile Saved",
        description: "Your company information has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save company profile.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({
        title: "Company Name Required",
        description: "Please enter your company name.",
        variant: "destructive",
      });
      return;
    }
    saveProfile.mutate();
  };

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold font-display text-primary">Company Profile</h2>
            <p className="text-muted-foreground">Set up your company information for compliance documentation</p>
          </div>
        </div>

        <Card data-testid="card-company-profile" className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Company Information
            </CardTitle>
            <CardDescription>
              Used for OSHA logs, DOT compliance, and audit documentation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input 
                      id="companyName" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Safety Corp"
                      data-testid="input-company-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger data-testid="select-industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="transportation">Transportation/Trucking</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                        <SelectItem value="mining">Mining</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="warehousing">Warehousing/Logistics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Employee Count</Label>
                    <Select value={employeeCount} onValueChange={setEmployeeCount}>
                      <SelectTrigger data-testid="select-employee-count">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-100">51-100</SelectItem>
                        <SelectItem value="101-500">101-500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street"
                    data-testid="input-address"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Houston"
                      data-testid="input-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="TX"
                      data-testid="input-state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input 
                      id="zipCode" 
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="77001"
                      data-testid="input-zip"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="naicsCode">NAICS Code</Label>
                    <Input 
                      id="naicsCode" 
                      value={naicsCode}
                      onChange={(e) => setNaicsCode(e.target.value)}
                      placeholder="e.g., 484121"
                      data-testid="input-naics"
                    />
                    <p className="text-xs text-muted-foreground">
                      North American Industry Classification for OSHA reporting
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dotNumber">DOT Number</Label>
                    <Input 
                      id="dotNumber" 
                      value={dotNumber}
                      onChange={(e) => setDotNumber(e.target.value)}
                      placeholder="e.g., 1234567"
                      data-testid="input-dot"
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for transportation/trucking companies
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Designated Employer Representative (DER)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    The DER is your company's primary contact for DOT drug & alcohol testing programs and compliance matters.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="derName">DER Name</Label>
                      <Input 
                        id="derName" 
                        value={derName}
                        onChange={(e) => setDerName(e.target.value)}
                        placeholder="John Smith"
                        data-testid="input-der-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="derPhone">DER Phone</Label>
                      <Input 
                        id="derPhone" 
                        value={derPhone}
                        onChange={(e) => setDerPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        data-testid="input-der-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="derEmail">DER Email</Label>
                      <Input 
                        id="derEmail" 
                        type="email"
                        value={derEmail}
                        onChange={(e) => setDerEmail(e.target.value)}
                        placeholder="der@company.com"
                        data-testid="input-der-email"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Primary Occupational Health Clinic</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set your company's designated clinic for DOT physicals, drug testing, and medical surveillance. 
                    This information will be included in DOT expiration notifications sent to employees.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic Name</Label>
                      <Input 
                        id="clinicName" 
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="e.g., ABC Occupational Health Services"
                        data-testid="input-clinic-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clinicAddress">Address</Label>
                      <Input 
                        id="clinicAddress" 
                        value={clinicAddress}
                        onChange={(e) => setClinicAddress(e.target.value)}
                        placeholder="e.g., 456 Medical Center Dr"
                        data-testid="input-clinic-address"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clinicCity">City</Label>
                        <Input 
                          id="clinicCity" 
                          value={clinicCity}
                          onChange={(e) => setClinicCity(e.target.value)}
                          placeholder="Houston"
                          data-testid="input-clinic-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clinicState">State</Label>
                        <Input 
                          id="clinicState" 
                          value={clinicState}
                          onChange={(e) => setClinicState(e.target.value)}
                          placeholder="TX"
                          data-testid="input-clinic-state"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clinicZipCode">ZIP Code</Label>
                        <Input 
                          id="clinicZipCode" 
                          value={clinicZipCode}
                          onChange={(e) => setClinicZipCode(e.target.value)}
                          placeholder="77001"
                          data-testid="input-clinic-zip"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clinicPhone">Phone</Label>
                        <Input 
                          id="clinicPhone" 
                          value={clinicPhone}
                          onChange={(e) => setClinicPhone(e.target.value)}
                          placeholder="(555) 987-6543"
                          data-testid="input-clinic-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clinicHours">Hours</Label>
                        <Input 
                          id="clinicHours" 
                          value={clinicHours}
                          onChange={(e) => setClinicHours(e.target.value)}
                          placeholder="e.g., Mon-Fri 8am-5pm"
                          data-testid="input-clinic-hours"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Company Logo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your company logo for use on compliance documents and reports. Max 2MB.
                  </p>
                  
                  <div className="flex items-start gap-6">
                    {logoUrl ? (
                      <div className="relative">
                        <img 
                          src={logoUrl} 
                          alt="Company Logo" 
                          className="w-32 h-32 object-contain border rounded-md bg-white"
                          data-testid="img-company-logo"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6"
                          onClick={removeLogo}
                          data-testid="button-remove-logo"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50">
                        <span className="text-sm text-muted-foreground">No logo</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                        data-testid="input-logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                        data-testid="button-upload-logo"
                      >
                        <Upload className="w-4 h-4" />
                        {logoUrl ? "Change Logo" : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, or GIF up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="gap-2 mt-4" 
                  disabled={saveProfile.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4" />
                  {saveProfile.isPending ? "Saving..." : "Save Company Profile"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <AuthorizationFormsSection />

        <ClinicLocationsSection />

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <div className="text-lg font-medium">{user?.firstName} {user?.lastName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="text-lg font-medium">{user?.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${subStatus?.isPro ? 'border-primary' : 'border-accent'}`}>
          <CardHeader>
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <CardTitle className="text-xl">Pro Subscription</CardTitle>
                <CardDescription>Unlock full access to compliance tools</CardDescription>
              </div>
              {subStatus?.isPro ? (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Active
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">Free Plan</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mt-2">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Unlimited Ask Corey AI Queries</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Full Access to OSHA 300, Log it or Not Tool</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Priority Email Support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {!subStatus?.isPro && (
              <Button 
                onClick={handleUpgrade} 
                disabled={isPending}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12"
                data-testid="button-upgrade"
              >
                {isPending ? "Processing..." : "Upgrade to Pro - $99/mo"}
              </Button>
            )}
            {subStatus?.isPro && (
              <Button variant="outline" className="w-full" data-testid="button-manage-subscription">Manage Subscription</Button>
            )}
          </CardFooter>
        </Card>

      </div>
    </ProtectedLayout>
  );
}
