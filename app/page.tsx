import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/auth/login");
  }
}
