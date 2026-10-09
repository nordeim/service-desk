/**
 * ServiceDesk — idempotent seed.
 *
 * Creates the demo login (demo@servicedesk.app / Demo1234!) plus a realistic
 * ticket corpus: the demo user's own tickets power the dashboard cards and
 * My Tickets, and other users' tickets power the global QUICK STATS block.
 *
 * Safe to re-run: every write is an upsert keyed on a natural key (email,
 * ticket title). Run with `bun run db:seed`.
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID, scryptSync, randomBytes } from "node:crypto";

// Reuse the same hashing rule as src/lib/auth.ts so the seeded user can
// actually sign in. Duplicated intentionally: prisma/seed.ts must not import
// app code (it runs through its own tsx/bun process with no @/ alias).
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const db = new PrismaClient();

const CATEGORIES = ["hardware", "software", "network", "access", "email", "other"] as const;
const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

type SeedTicket = {
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  priority: "low" | "medium" | "high" | "urgent";
  status: (typeof STATUSES)[number];
  owner: string; // email key
  ageDays: number;
  comments?: { author: string; content: string; ageDays: number }[];
};

const SEED_TICKETS: SeedTicket[] = [
  {
    title: "Laptop battery not charging",
    description:
      "My laptop battery drains quickly and does not charge when plugged in. The charging LED does not light up. I have tried a different outlet with the same result.",
    category: "hardware",
    priority: "medium",
    status: "open",
    owner: "demo@servicedesk.app",
    ageDays: 1,
  },
  {
    title: "VPN disconnects every 15 minutes",
    description:
      "Since the last client update the VPN tunnel drops every ~15 minutes. Reconnecting works, but I lose unsaved work in the CRM. Colleagues on the same floor report the same pattern.",
    category: "network",
    priority: "high",
    status: "in_progress",
    owner: "demo@servicedesk.app",
    ageDays: 3,
    comments: [
      {
        author: "agent@servicedesk.app",
        content: "We can reproduce this on the legacy gateway profile. A fix is being rolled out tonight — please keep the client on auto-update.",
        ageDays: 2,
      },
    ],
  },
  {
    title: "Cannot access shared finance drive",
    description:
      "Access to \\\\fileserver\\finance returns 'Access is denied' since Monday. I need the Q3 receipts folder for month-end close.",
    category: "access",
    priority: "urgent",
    status: "open",
    owner: "demo@servicedesk.app",
    ageDays: 0,
  },
  {
    title: "Outlook signature resets on restart",
    description:
      "My custom Outlook signature disappears after every reboot and falls back to the default template. Roaming settings seem to not sync.",
    category: "email",
    priority: "low",
    status: "resolved",
    owner: "demo@servicedesk.app",
    ageDays: 9,
    comments: [
      {
        author: "agent@servicedesk.app",
        content: "Roaming profile was corrupted. We rebuilt it and restored your signature from the backup — please verify.",
        ageDays: 7,
      },
      {
        author: "demo@servicedesk.app",
        content: "Confirmed, signature survives reboots now. Thanks!",
        ageDays: 7,
      },
    ],
  },
  {
    title: "Slack desktop app crashes on screen share",
    description:
      "Sharing my screen in a huddle crashes the desktop app after 2-3 minutes. Windows Event Viewer shows a graphics driver timeout.",
    category: "software",
    priority: "medium",
    status: "closed",
    owner: "demo@servicedesk.app",
    ageDays: 21,
  },
  // --- other users: these power the global QUICK STATS, not "My Tickets" ---
  {
    title: "Monitor flickering at 144Hz",
    description: "External monitor flickers when set to 144Hz over DisplayPort. 60Hz is stable.",
    category: "hardware",
    priority: "medium",
    status: "open",
    owner: "maya@servicedesk.app",
    ageDays: 2,
  },
  {
    title: "Excel macros blocked by security policy",
    description: "Finance workbook macros are blocked after the policy update. Need an exception for the reconciliation tool.",
    category: "software",
    priority: "high",
    status: "open",
    owner: "jonas@servicedesk.app",
    ageDays: 1,
  },
  {
    title: "New starter needs ERP credentials",
    description: "Please provision an ERP account for the new hire starting Monday in logistics.",
    category: "access",
    priority: "medium",
    status: "in_progress",
    owner: "maya@servicedesk.app",
    ageDays: 4,
  },
  {
    title: "Printer on floor 3 offline",
    description: "The corridor printer shows offline for everyone on floor 3 since this morning.",
    category: "hardware",
    priority: "low",
    status: "resolved",
    owner: "jonas@servicedesk.app",
    ageDays: 12,
  },
  {
    title: "Mail queue delay for external recipients",
    description: "External mail is delayed 20+ minutes. Internal delivery is instant.",
    category: "email",
    priority: "high",
    status: "resolved",
    owner: "maya@servicedesk.app",
    ageDays: 15,
  },
  {
    title: "Guest Wi-Fi captive portal not loading",
    description: "The guest Wi-Fi portal page spins forever on iPhones. Android devices are fine.",
    category: "network",
    priority: "medium",
    status: "closed",
    owner: "jonas@servicedesk.app",
    ageDays: 30,
  },
];

async function main(): Promise<void> {
  const users = [
    { email: "demo@servicedesk.app", name: "Demo User", password: "Demo1234!" },
    { email: "agent@servicedesk.app", name: "Support Agent", password: "Agent1234!" },
    { email: "maya@servicedesk.app", name: "Maya Chen", password: "Maya1234!" },
    { email: "jonas@servicedesk.app", name: "Jonas Weber", password: "Jonas1234!" },
  ];

  const userIds = new Map<string, string>();
  for (const u of users) {
    const row = await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name }, // never overwrite an existing password hash
      create: { email: u.email, name: u.name, passwordHash: hashPassword(u.password) },
    });
    userIds.set(u.email, row.id);
  }

  for (const t of SEED_TICKETS) {
    const existing = await db.ticket.findFirst({ where: { title: t.title } });
    if (existing) continue;
    const created = await db.ticket.create({
      data: {
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdById: userIds.get(t.owner)!,
        createdAt: new Date(Date.now() - t.ageDays * 24 * 3600 * 1000),
      },
    });
    for (const c of t.comments ?? []) {
      await db.comment.create({
        data: {
          ticketId: created.id,
          authorId: userIds.get(c.author)!,
          content: c.content,
          createdAt: new Date(Date.now() - c.ageDays * 24 * 3600 * 1000),
        },
      });
    }
  }

  const counts = {
    users: await db.user.count(),
    tickets: await db.ticket.count(),
    comments: await db.comment.count(),
  };
  console.log(`[seed] idempotent run complete:`, counts);
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
