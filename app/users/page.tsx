import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UsersClient from "@/components/users/users-client";

export const runtime = "nodejs";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only admins can manage users
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <UsersClient />;
}
