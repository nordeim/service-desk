import type { Metadata, Viewport } from "next";
import "./globals.css";

// Reference parity (measured session 5): the reference app loads NO webfont —
// its body computes Tailwind's default system stack (ui-sans-serif, system-ui,
// …). The next/font Inter here was an unmeasured session-1 assumption and a
// real family-level divergence (~10% text-width deltas on button labels),
// so it was removed; `font-sans` now resolves to the default stack. The
// reference also leaves font smoothing at `auto` (no `antialiased`).

export const metadata: Metadata = {
  title: {
    default: "ServiceDesk | IT Support Portal",
    template: "%s | ServiceDesk",
  },
  description:
    "Submit, track, and resolve IT support tickets — hardware, software, network, access, and email issues.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
