import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import hubLogo from "@assets/8_1774207860083.png";

async function apiPost(path: string, body: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

export default function Login() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiPost("/api/auth/login", data),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setLocation("/dashboard");
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: (data: object) => apiPost("/api/auth/register", data),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setLocation("/dashboard");
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    const errs: Record<string, string> = {};
    if (!loginEmail.trim()) errs.email = "Email is required";
    if (!loginPassword) errs.password = "Password is required";
    setLoginErrors(errs);
    if (Object.keys(errs).length > 0) return;
    loginMutation.mutate({ email: loginEmail.trim(), password: loginPassword });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!regEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim()))
      errs.email = "Enter a valid email address";
    if (regPassword.length < 8) errs.password = "Password must be at least 8 characters";
    if (regPassword !== regConfirm) errs.confirm = "Passwords do not match";
    setRegErrors(errs);
    if (Object.keys(errs).length > 0) return;
    registerMutation.mutate({
      email: regEmail.trim(),
      password: regPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  }

  function switchMode(m: "login" | "register") {
    setMode(m);
    setErrorMsg("");
    setLoginErrors({});
    setRegErrors({});
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src={hubLogo} alt="Core Compliance Hub" className="h-16 w-auto" data-testid="img-logo" />
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>AI-Powered Occupational Health &amp; Safety Compliance</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        {/* Tabs */}
        <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "login" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"}`}
            onClick={() => switchMode("login")}
            data-testid="tab-login"
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "register" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"}`}
            onClick={() => switchMode("register")}
            data-testid="tab-register"
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* ── Sign In form ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className={inputClass}
                data-testid="input-email"
              />
              {loginErrors.email && <p className="text-red-400 text-xs mt-1">{loginErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputClass + " pr-10"}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginErrors.password && <p className="text-red-400 text-xs mt-1">{loginErrors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              data-testid="button-sign-in"
            >
              {isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        )}

        {/* ── Create Account form ── */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4" autoComplete="on">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoComplete="given-name"
                  className={inputClass}
                  data-testid="input-first-name"
                />
                {regErrors.firstName && <p className="text-red-400 text-xs mt-1">{regErrors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  autoComplete="family-name"
                  className={inputClass}
                  data-testid="input-last-name"
                />
                {regErrors.lastName && <p className="text-red-400 text-xs mt-1">{regErrors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Work Email</label>
              <input
                type="text"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
                className={inputClass}
                data-testid="input-register-email"
              />
              {regErrors.email && <p className="text-red-400 text-xs mt-1">{regErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={inputClass + " pr-10"}
                  data-testid="input-register-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regErrors.password && <p className="text-red-400 text-xs mt-1">{regErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className={inputClass + " pr-10"}
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regErrors.confirm && <p className="text-red-400 text-xs mt-1">{regErrors.confirm}</p>}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              data-testid="button-create-account"
            >
              {isPending ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing you agree to our{" "}
          <a href="/sms-consent" className="text-orange-400 hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="/sms-consent" className="text-orange-400 hover:underline">Privacy Policy</a>
        </p>
      </div>

      <p className="mt-6 text-slate-600 text-xs">
        © {new Date().getFullYear()} Core Compliance Hub. All rights reserved.
      </p>
    </div>
  );
}
