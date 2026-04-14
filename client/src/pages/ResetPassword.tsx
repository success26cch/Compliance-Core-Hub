import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import hubLogo from "@assets/8_1774207860083.png";

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    if (!token) return setError("Invalid reset link. Please request a new one.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src={hubLogo} alt="Core Compliance Hub" className="h-32 w-auto" />
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>AI-Powered Occupational Health &amp; Safety Compliance</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <h2 className="text-white text-xl font-semibold">Password Updated</h2>
            <p className="text-slate-400 text-sm">Your password has been reset successfully. You can now sign in with your new password.</p>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              onClick={() => setLocation("/login")}
            >
              Go to Sign In
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-white text-xl font-semibold mb-1">Set New Password</h2>
            <p className="text-slate-400 text-sm mb-6">Enter a new password for your account.</p>

            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {!token && (
              <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">Invalid or missing reset token. Please request a new password reset link.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={inputClass + " pr-10"}
                    data-testid="input-new-password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className={inputClass + " pr-10"}
                    data-testid="input-confirm-password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                data-testid="button-reset-password"
              >
                {loading ? "Updating…" : "Update Password"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-slate-400 hover:text-orange-400 transition-colors"
                onClick={() => setLocation("/login")}
              >
                Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-6 text-slate-600 text-xs">© {new Date().getFullYear()} Core Compliance Hub. All rights reserved.</p>
    </div>
  );
}
