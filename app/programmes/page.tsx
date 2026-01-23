import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ProgrammesClient from "@/components/programmes/programmes-client";

export const runtime = "nodejs";

export default async function ProgrammesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only admins can access programme management
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <ProgrammesClient />;
}
