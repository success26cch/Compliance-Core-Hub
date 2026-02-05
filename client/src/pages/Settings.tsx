import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus, useCreateCheckoutSession } from "@/hooks/use-subscriptions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Shield, Building2, Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompanyProfile } from "@shared/schema";

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
    }
  }, [profile]);

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
        <h2 className="text-2xl font-bold font-display text-primary">Account & Settings</h2>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
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

        <Card data-testid="card-company-profile">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Company Profile
            </CardTitle>
            <CardDescription>
              Company information used for OSHA logs, DOT compliance, and audit documentation.
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

                <Button 
                  type="submit" 
                  className="gap-2" 
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
                <span>Unlimited OccHealth Consultant Queries</span>
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
                {isPending ? "Processing..." : "Upgrade to Pro - $29/mo"}
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
