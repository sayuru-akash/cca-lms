import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ProgrammesClient from "@/components/programmes/programmes-client";
import LecturerProgrammesClient from "@/components/programmes/lecturer-programmes-client";

export const runtime = "nodejs";

export default async function ProgrammesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Admins and lecturers can access programmes
  if (session.user.role === "ADMIN") {
    return <ProgrammesClient />;
  } else if (session.user.role === "LECTURER") {
    return <LecturerProgrammesClient />;
  } else {
    redirect("/dashboard");
  }
}
