"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Reference-designed 404 (measured session 4 from the live reference's
// catch-all view): a centered max-w-md block with the giant light "404",
// a short divider bar, "Page Not Found", a path-aware message, and a
// bordered "Go Home" button. The reference renders this inside its SPA
// shell; Next's not-found renders inside the root layout (no sidebar) —
// the content design is identical.
export default function NotFound() {
  const pathname = usePathname();
  // Reference message: The page "signup" could not be found in this application.
  const route = pathname.replace(/^\//, "").split("?")[0] || "this page";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">404</h1>
            <div className="h-0.5 w-16 bg-slate-200 mx-auto" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">Page Not Found</h2>
            <p className="text-slate-600 leading-relaxed">
              The page <span className="font-medium text-slate-700">&quot;{route}&quot;</span> could not be
              found in this application.
            </p>
          </div>
          <div className="pt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
