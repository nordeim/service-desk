"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Login card — reference parity (measured session 2 from the live DOM):
// max-w-md shell, white/95 + backdrop-blur card with a slate gradient top
// bar, in-card logo circle (ring-4) with glow, text-2xl sm:text-3xl heading,
// bg-slate-50/50 inputs (h-11 sm:h-12, focus:border-slate-400), a bg-slate-900
// sign-in button, and the OR divider between Google and the form.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        setFieldErrors(data.errors ?? {});
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
          {/* Reference: slate gradient top bar. */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" aria-hidden />

          <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
            <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
              {/* In-card logo circle with glow (reference). */}
              <div className="relative group">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                  aria-hidden
                />
                <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50 group-hover:shadow-xl transition-all duration-300">
                  <img
                    className="aspect-square h-full w-full object-cover"
                    alt="ServiceDesk logo"
                    src="/logo.png"
                  />
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Welcome to ServiceDesk
                </h1>
                <p className="text-slate-500 text-sm sm:text-base font-medium">Sign in to continue</p>
              </div>

              <div className="w-full">
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-base"
                    onClick={() =>
                      setError("Google sign-in is not configured in this deployment. Use email and password.")
                    }
                  >
                    {/* Reference (measured session 4): the Google logo sits in
                        a transition-transform wrapper pulled 16px left. */}
                    <div className="transition-transform duration-200 -ml-4">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
                      />
                    </svg>
                    </div>
                    Continue with Google
                  </Button>

                  {/* Reference OR divider. */}
                  <div className="relative my-6" aria-hidden>
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full h-px bg-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-slate-500 font-medium tracking-wider">or</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                            aria-hidden
                          />
                          <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className="pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-invalid={!!fieldErrors.email}
                          />
                        </div>
                        {fieldErrors.email ? (
                          <p className="text-xs text-red-600">{fieldErrors.email}</p>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                            aria-hidden
                          />
                          <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-invalid={!!fieldErrors.password}
                          />
                        </div>
                        {fieldErrors.password ? (
                          <p className="text-xs text-red-600">{fieldErrors.password}</p>
                        ) : null}
                      </div>
                    </div>

                    {error ? (
                      <p
                        className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                        role="alert"
                      >
                        {error}
                      </p>
                    ) : null}

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200"
                      >
                        {loading ? "Signing in…" : "Sign in"}
                      </Button>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                        <Link
                          href="/forgotpassword"
                          className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                        >
                          Forgot password?
                        </Link>
                        <p className="text-sm text-slate-500">
                          Need an account?{" "}
                          <Link
                            href="/signup"
                            className="font-medium text-slate-700 hover:text-slate-900 transition-colors"
                          >
                            Sign up
                          </Link>
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
