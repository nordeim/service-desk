"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Ticket, User } from "lucide-react";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/60 px-8 py-10 pt-14 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg flex flex-col items-center justify-center">
            <Ticket className="w-6 h-6 text-cyan-400" aria-hidden />
            <span className="text-[10px] font-semibold text-white tracking-wide mt-0.5">
              SERVICE DESK
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-slate-500 mt-1">Start tracking your IT support requests</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="h-11 pl-10"
                  value={form.name}
                  onChange={update("name")}
                  required
                  aria-invalid={!!fieldErrors.name}
                />
              </div>
              {fieldErrors.name ? <p className="text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="h-11 pl-10"
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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters, letters + numbers"
                  className="h-11 pl-10"
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
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
            >
              {loading ? "Creating account…" : "Sign up"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-cyan-600 hover:text-cyan-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
