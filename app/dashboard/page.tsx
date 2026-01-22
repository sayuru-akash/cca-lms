import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminDashboard from "@/components/dashboards/admin-dashboard";
import LecturerDashboard from "@/components/dashboards/lecturer-dashboard";
import StudentDashboard from "@/components/dashboards/student-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { role } = session.user;

  // Render role-specific dashboard
  switch (role) {
    case "ADMIN":
      return <AdminDashboard user={session.user} />;
    case "LECTURER":
      return <LecturerDashboard user={session.user} />;
    case "STUDENT":
      return <StudentDashboard user={session.user} />;
    default:
      return (
        <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
          <p className="text-terminal-text-muted font-mono">
            Invalid user role
          </p>
        </div>
      );
  }
}
