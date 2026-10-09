import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Root entry: authenticated users land on the dashboard, everyone else on
// the login page (the reference app redirects "/" → "/dashboard" when
// signed in, and renders the login card otherwise).
export default async function Home() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/login");
}
