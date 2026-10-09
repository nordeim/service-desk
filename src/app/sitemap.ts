import type { MetadataRoute } from "next";

// Session 10: the reference ships a sitemap.xml (base44 auto-generates one
// listing every scaffold route — including dead ones that render 200-empty).
// Ours serves the four PUBLIC routes only: the authenticated app routes are
// login-walled and listing them would be an SEO anti-pattern (the deliberate
// superset over the reference's boilerplate). The origin comes from
// NEXT_PUBLIC_SITE_URL (the canonical-origin variable in .env.example).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/forgotpassword`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
