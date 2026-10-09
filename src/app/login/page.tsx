"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Login card — reference parity (measured session 2 from the live DOM):
// max-w-md shell, white/95 + backdrop-blur card with a slate gradient top
// bar, in-card logo circle (ring-4) with glow, text-2xl sm:text-3xl heading,
// bg-slate-50/50 inputs (h-11 sm:h-12, focus:border-slate-400), a bg-slate-900
// sign-in button, and the OR divider between Google and the form.
//
// Session 10: the card is a VIEW STATE MACHINE (live-measured — the
// reference's "Forgot password?" and "Need an account? Sign up" are buttons
// that swap the card content in place; the URL never changes). The swapped
// views replace the logo/h1/Google block with a back button + h2 and render
// a shorter input/button generation (h-10 sm:h-11). The standalone
// /signup and /forgotpassword pages remain as the URL supersets. Our
// no-fake-verification signup (direct sign-in on create) stays the
// documented superset over the reference's base44 email-verification wall.
type LoginView = "signin" | "reset" | "reset-success" | "signup";

// The swapped views' input generation (live-measured): h-10 sm:h-11 with
// slate-400 placeholders (the sign-in form renders h-11 sm:h-12 with
// slate-600). The focus tail matches our session-6 auth-input contract
// (2px slate-400 + white offset) — computed-identical to the reference's
// plain focus:ring-slate-400 over their v3 Input base.
const SWAPPED_INPUT_CLASSES =
  "pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white rounded-xl shadow-none placeholder:text-slate-400";

// The swapped views' submit generation: h-10 sm:h-11; the reference's v3
// shadow-sm name computes to our shadow-xs (the session-5 naming trap).
const SWAPPED_SUBMIT_CLASSES =
  "w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs rounded-xl transition-all duration-200";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = React.useState<LoginView>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  // Reset-view state.
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [resetLoading, setResetLoading] = React.useState(false);

  // Signup-view state (no name field — the reference's in-card signup has
  // none; the account name derives from the email local-part, matching the
  // reference's email-local-part display convention).
  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPassword, setSignupPassword] = React.useState("");
  const [signupConfirm, setSignupConfirm] = React.useState("");
  const [signupError, setSignupError] = React.useState<string | null>(null);
  const [signupFieldErrors, setSignupFieldErrors] = React.useState<Record<string, string>>({});
  const [signupLoading, setSignupLoading] = React.useState(false);

  function switchView(next: LoginView) {
    setView(next);
    setError(null);
    setFieldErrors({});
    setResetError(null);
    setSignupError(null);
    setSignupFieldErrors({});
  }

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

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setResetError(data.error ?? "Request failed");
        return;
      }
      // The reference swaps to the Check-your-email view on submit; our API
      // is enumeration-safe (generic response) so the view renders for any
      // address — same UX as the reference.
      setView("reset-success");
    } catch {
      setResetError("Network error — please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignupError(null);
    setSignupFieldErrors({});
    if (signupPassword !== signupConfirm) {
      setSignupFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The name derives from the email local-part (base44 auth has no
        // name concept — the reference displays local-parts everywhere).
        body: JSON.stringify({
          name: signupEmail.split("@")[0] || "New User",
          email: signupEmail,
          password: signupPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok) {
        setSignupError(data.error ?? "Sign up failed");
        setSignupFieldErrors(data.errors ?? {});
        return;
      }
      // Direct sign-in on create — the documented superset over the
      // reference's base44 email-verification wall (we ship no mail
      // transport; a stubbed verification flow would be fake).
      router.push("/dashboard");
      router.refresh();
    } catch {
      setSignupError("Network error — please try again.");
    } finally {
      setSignupLoading(false);
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
              {view === "signin" ? (
                <>
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
                        className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-xs shadow-none transition-all duration-200 font-medium text-base"
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
                                className="pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white rounded-xl shadow-none placeholder:text-slate-600"
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
                                className="pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white rounded-xl shadow-none placeholder:text-slate-600"
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

                        {/* Reference (live-measured session 8, wrong-password
                            flow): a shadcn-Alert-style banner — p-4 (16px),
                            rounded-xl (12px), translucent bg-red-50/70,
                            border-red-200, text-red-700. Was px-3 py-2 /
                            rounded-lg / opaque red-50 / red-600. The p[role=alert]
                            stays (a11y superset + the auth.spec pin). */}
                        {error ? (
                          <p
                            className="text-sm text-red-700 bg-red-50/70 border border-red-200 rounded-xl p-4"
                            role="alert"
                          >
                            {error}
                          </p>
                        ) : null}

                        <div className="space-y-3">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs rounded-xl transition-all duration-200"
                          >
                            {loading ? "Signing in…" : "Sign in"}
                          </Button>
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                            {/* Session 10: the reference swaps the card to the
                                reset view in place — a button, not a link. */}
                            <button
                              type="button"
                              onClick={() => switchView("reset")}
                              className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                            >
                              Forgot password?
                            </button>
                            {/* Reference (measured session 6): the WHOLE line is
                                one control — text-sm text-slate-500
                                hover:text-slate-700 transition-colors with an
                                inner font-medium text-slate-700 span. Session
                                10: it swaps to the in-card signup view. */}
                            <button
                              type="button"
                              onClick={() => switchView("signup")}
                              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              Need an account?{" "}
                              <span className="font-medium text-slate-700">Sign up</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              ) : view === "reset" ? (
                /* Reset view (live-measured session 10): back button + h2 +
                   subtext + the single-field form; the logo/h1/Google block
                   is replaced entirely. */
                <div className="w-full">
                  <div className="space-y-4 sm:space-y-6">
                    <button
                      type="button"
                      onClick={() => switchView("signin")}
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Back to sign in
                    </button>
                    <div className="text-center space-y-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Reset your password
                      </h2>
                      <p className="text-slate-600 text-sm sm:text-base">
                        Enter your email and we&apos;ll send you a link to reset your password
                      </p>
                    </div>
                    <form onSubmit={handleResetSubmit} className="space-y-4 sm:space-y-5" noValidate>
                      <div className="space-y-1.5">
                        <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                            aria-hidden
                          />
                          <Input
                            id="reset-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className={SWAPPED_INPUT_CLASSES}
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            aria-invalid={!!resetError}
                          />
                        </div>
                      </div>
                      {resetError ? (
                        <p
                          className="text-sm text-red-700 bg-red-50/70 border border-red-200 rounded-xl p-4"
                          role="alert"
                        >
                          {resetError}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        disabled={resetLoading}
                        className={SWAPPED_SUBMIT_CLASSES}
                      >
                        {resetLoading ? "Sending…" : "Send reset link"}
                      </Button>
                    </form>
                  </div>
                </div>
              ) : view === "reset-success" ? (
                /* Check-your-email view (live-measured session 10): the
                   slate icon circle + h2 + email paragraph, the green
                   alert, and the full-width back button. */
                <div className="w-full">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center space-y-3 sm:space-y-4">
                      <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-slate-700" aria-hidden />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Check your email
                        </h2>
                        <p className="text-slate-600 text-sm sm:text-base">
                          We&apos;ve sent password reset instructions to<br />
                          <span className="font-medium text-slate-900">{resetEmail}</span>
                        </p>
                      </div>
                    </div>
                    <div
                      role="alert"
                      className="relative w-full border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground text-foreground bg-green-50/70 border-green-200 rounded-xl"
                    >
                      <div className="[&_p]:leading-relaxed text-green-700 text-sm">
                        Please check your email for the password reset link. It may take a few minutes to arrive.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView("signin")}
                      className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Back to sign in
                    </button>
                  </div>
                </div>
              ) : (
                /* Signup view (live-measured session 10): back button + h2 +
                   the three-field form (no name field — base44 auth has no
                   name concept; the client derives it from the local-part). */
                <div className="w-full">
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => switchView("signin")}
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Back to sign in
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Create your account
                    </h2>
                    <form onSubmit={handleSignupSubmit} className="space-y-3 sm:space-y-4" noValidate>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700">
                            Email
                          </Label>
                          <div className="relative">
                            <Mail
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                              aria-hidden
                            />
                            <Input
                              id="signup-email"
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              className={`${SWAPPED_INPUT_CLASSES} text-sm sm:text-base`}
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              required
                              aria-invalid={!!signupFieldErrors.email}
                            />
                          </div>
                          {signupFieldErrors.email ? (
                            <p className="text-xs text-red-600">{signupFieldErrors.email}</p>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                              aria-hidden
                            />
                            <Input
                              id="signup-password"
                              type="password"
                              autoComplete="new-password"
                              placeholder="Min. 8 characters"
                              className={`${SWAPPED_INPUT_CLASSES} text-sm sm:text-base`}
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              required
                              aria-invalid={!!signupFieldErrors.password}
                            />
                          </div>
                          {signupFieldErrors.password ? (
                            <p className="text-xs text-red-600">{signupFieldErrors.password}</p>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                              aria-hidden
                            />
                            <Input
                              id="confirmPassword"
                              type="password"
                              autoComplete="new-password"
                              placeholder="Re-enter password"
                              className={`${SWAPPED_INPUT_CLASSES} text-sm sm:text-base`}
                              value={signupConfirm}
                              onChange={(e) => setSignupConfirm(e.target.value)}
                              required
                              aria-invalid={!!signupFieldErrors.confirmPassword}
                            />
                          </div>
                          {signupFieldErrors.confirmPassword ? (
                            <p className="text-xs text-red-600">{signupFieldErrors.confirmPassword}</p>
                          ) : null}
                        </div>
                      </div>
                      {signupError ? (
                        <p
                          className="text-sm text-red-700 bg-red-50/70 border border-red-200 rounded-xl p-4"
                          role="alert"
                        >
                          {signupError}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        disabled={signupLoading}
                        className={SWAPPED_SUBMIT_CLASSES}
                      >
                        {signupLoading ? "Creating account…" : "Create account"}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
