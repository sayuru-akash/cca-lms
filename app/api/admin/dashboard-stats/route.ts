import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date for active users calculation
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all statistics in parallel
    const [
      totalStudents,
      totalLecturers,
      totalAdmins,
      totalProgrammes,
      activeUsersToday,
      activeUsersWeek,
      recentLogs,
      totalEnrollments,
      totalAssignments,
      totalSubmissions,
      pendingGrading,
      overdueAssignments,
      enrollmentsByProgramme,
    ] = await Promise.all([
      // Count students
      prisma.user.count({
        where: { role: "STUDENT", status: "ACTIVE" },
      }),

      // Count lecturers
      prisma.user.count({
        where: { role: "LECTURER", status: "ACTIVE" },
      }),

      // Count admins
      prisma.user.count({
        where: { role: "ADMIN", status: "ACTIVE" },
      }),

      // Count programmes (courses)
      prisma.course.count({
        where: { status: { not: "ARCHIVED" } },
      }),

      // Active users today (logged in within last 24 hours)
      prisma.auditLog.findMany({
        where: {
          action: "USER_LOGIN",
          createdAt: { gte: oneDayAgo },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),

      // Active users this week
      prisma.auditLog.findMany({
        where: {
          action: "USER_LOGIN",
          createdAt: { gte: sevenDaysAgo },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),

      // Recent audit logs (last 10 activities)
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),

      // Total enrollments (students only)
      prisma.courseEnrollment.count({
        where: { status: "ACTIVE", user: { role: "STUDENT" } },
      }),

      // Assignment statistics
      prisma.assignment.count(),

      // Total submissions
      prisma.assignmentSubmission.count(),

      // Pending grading (submissions with null grade)
      prisma.assignmentSubmission.count({
        where: { grade: null },
      }),

      // Overdue assignments (past due date with no submission)
      prisma.assignment.count({
        where: {
          dueDate: { lt: new Date() },
          assignmentSubmissions: {
            none: {},
          },
        },
      }),

      // Get enrollments per programme (top 5)
      prisma.course.findMany({
        where: { status: { not: "ARCHIVED" } },
        take: 5,
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              enrollments: {
                where: {
                  status: "ACTIVE",
                  user: {
                    role: "STUDENT",
                  },
                },
              },
            },
          },
        },
        orderBy: {
          enrollments: {
            _count: "desc",
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalStudents,
        totalLecturers,
        totalAdmins,
        totalProgrammes,
        totalEnrollments,
        activeUsersToday: activeUsersToday.length,
        activeUsersWeek: activeUsersWeek.length,
        totalAssignments,
        totalSubmissions,
        pendingGrading,
        overdueAssignments,
      },
      enrollmentsByProgramme: enrollmentsByProgramme.map((course) => ({
        id: course.id,
        title: course.title,
        enrollments: course._count.enrollments,
      })),
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        createdAt: log.createdAt,
        user: log.user
          ? {
              name: log.user.name || "Unknown",
              email: log.user.email,
              role: log.user.role,
            }
          : null,
        metadata: log.metadata,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
