import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BulkEnrollClient from "@/components/bulk-enroll/bulk-enroll-client";

export const runtime = "nodejs";

export default async function BulkEnrollPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only admins can bulk enroll
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <BulkEnrollClient />;
}
