import type { MetadataRoute } from "next";

// Session 10: robots.txt as a route (replaces the old static public/robots.txt)
// so the Sitemap directive can carry the deployed origin (a static file
// cannot know it). Keeps the production-sane policy the static file had —
// the authenticated routes and the API stay out of crawlers — and adds the
// Sitemap line the reference ships.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/submitticket", "/mytickets", "/ticketdetails", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
