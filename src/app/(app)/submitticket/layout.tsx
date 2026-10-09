import type { Metadata } from "next";

// Per-route document titles (session 7) — see dashboard/layout.tsx for the
// rationale (client-island pages + reference per-route title pattern).
export const metadata: Metadata = {
  title: "Submit Ticket",
};

export default function SubmitTicketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
