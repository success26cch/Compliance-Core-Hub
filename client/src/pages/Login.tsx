import { useState } from "react";
import { useLocation, Link } from "wouter";
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
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const queryClient = useQueryClient();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiPost("/api/auth/login", data),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setLocation(user?.isoOnly ? "/iso-manager" : "/dashboard");
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const isPending = loginMutation.isPending;

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

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setErrorMsg("");
    try {
      await apiPost("/api/auth/forgot-password", { email: forgotEmail.trim() });
      setForgotSent(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Link href="/">
          <img src={hubLogo} alt="Core Compliance Hub" className="h-32 w-auto cursor-pointer hover:opacity-80 transition-opacity" data-testid="img-logo" />
        </Link>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>AI-Powered Occupational Health &amp; Safety Compliance</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">

        {errorMsg && (
          <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* ── Sign In form ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1">Sign in to your Core Compliance Hub account</p>
            </div>

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  className="text-xs text-orange-400 hover:underline"
                  onClick={() => { setMode("forgot"); setErrorMsg(""); }}
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </button>
              </div>
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
              data-testid="button-login"
            >
              {isPending ? "Signing in…" : "Sign In"}
            </Button>

            <div className="mt-2 pt-4 border-t border-slate-800 text-center">
              <p className="text-slate-500 text-sm">Don't have an account?</p>
              <a
                href="/get-started"
                className="inline-block mt-2 text-orange-400 hover:text-orange-300 text-sm font-semibold hover:underline transition-colors"
                data-testid="link-get-started"
              >
                Get started with Core Compliance Hub →
              </a>
            </div>
          </form>
        )}

        {/* ── Forgot Password form ── */}
        {mode === "forgot" && (
          <div className="space-y-4">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white">Reset your password</h2>
              <p className="text-slate-400 text-sm mt-1">Enter your email and we'll send a reset link.</p>
            </div>

            {forgotSent ? (
              <div className="bg-green-950 border border-green-800 rounded-lg p-4 text-green-300 text-sm">
                If that email is in our system, a reset link is on its way. Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Work Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className={inputClass}
                    data-testid="input-forgot-email"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                  data-testid="button-send-reset"
                >
                  {forgotLoading ? "Sending…" : "Send Reset Link"}
                </Button>
              </form>
            )}

            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMsg(""); setForgotSent(false); }}
              className="block w-full text-center text-sm text-slate-400 hover:text-white mt-2"
              data-testid="link-back-to-login"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing you agree to our{" "}
          <a href="/terms-of-service" className="text-orange-400 hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy-policy" className="text-orange-400 hover:underline">Privacy Policy</a>
        </p>
      </div>

      <p className="mt-6 text-slate-600 text-xs">
        © {new Date().getFullYear()} Core Compliance Hub. All rights reserved.
      </p>
    </div>
  );
}
