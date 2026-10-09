"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({ name: "", email: "", password: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok) {
        setError(data.error ?? "Sign up failed");
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
    // Superset page (no reference counterpart — the reference /signup is a
    // 404): follows the reference login card design language.
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" aria-hidden />

          <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
            <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
              <div className="relative group">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                  aria-hidden
                />
                <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50 group-hover:shadow-xl transition-all duration-300">
                  <img className="aspect-square h-full w-full object-cover" alt="ServiceDesk logo" src="/logo.png" />
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Create your account
                </h1>
                <p className="text-slate-500 text-sm sm:text-base font-medium">
                  Start tracking your IT support requests
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-5" noValidate>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                      <Input
                        id="name"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        className="pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white rounded-xl shadow-none placeholder:text-slate-600"
                        value={form.name}
                        onChange={update("name")}
                        required
                        aria-invalid={!!fieldErrors.name}
                      />
                    </div>
                    {fieldErrors.name ? <p className="text-xs text-red-600">{fieldErrors.name}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white rounded-xl shadow-none placeholder:text-slate-600"
                        value={form.email}
                        onChange={update("email")}
                        required
                        aria-invalid={!!fieldErrors.email}
                      />
                    </div>
                    {fieldErrors.email ? (
                      <p className="text-xs text-red-600">{fieldErrors.email}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                      <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters, letters + numbers"
                        className="pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white rounded-xl shadow-none placeholder:text-slate-600"
                        value={form.password}
                        onChange={update("password")}
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs rounded-xl transition-all duration-200"
                >
                  {loading ? "Creating account…" : "Sign up"}
                </Button>

                {/* Same whole-line pattern as the login signup line
                    (session 6) — the reference renders one control with the
                    hover on the line. */}
                <Link
                  href="/login"
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Already have an account?{" "}
                  <span className="font-medium text-slate-700">Sign in</span>
                </Link>
              </form>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
