import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import hubLogo from "@assets/6_1770259909295.png";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

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

export default function Login() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => apiPost("/api/auth/login", data),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setLocation("/dashboard");
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      apiPost("/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setLocation("/dashboard");
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

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
        {/* Mode tabs */}
        <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "login" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"}`}
            onClick={() => { setMode("login"); setErrorMsg(""); }}
            data-testid="tab-login"
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "register" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"}`}
            onClick={() => { setMode("register"); setErrorMsg(""); }}
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

        {mode === "login" ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit((d) => { setErrorMsg(""); loginMutation.mutate(d); })} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Work Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@company.com"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500 pr-10"
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
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                data-testid="button-sign-in"
              >
                {isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit((d) => { setErrorMsg(""); registerMutation.mutate(d); })} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={registerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jane" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500" data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Smith" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500" data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Work Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="you@company.com" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500" data-testid="input-register-email" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500 pr-10" data-testid="input-register-password" />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showConfirm ? "text" : "password"} placeholder="Re-enter password" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500 pr-10" data-testid="input-confirm-password" />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" onClick={() => setShowConfirm(!showConfirm)}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                data-testid="button-create-account"
              >
                {isPending ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          </Form>
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
