import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import NewProgrammeClient from "@/components/programmes/new-programme-client";

export const runtime = "nodejs";

export default async function NewProgrammePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only admins can create programmes
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <NewProgrammeClient />;
}
