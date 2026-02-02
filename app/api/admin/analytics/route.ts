import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  programmeId?: string;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const programmeId = searchParams.get("programmeId");

    const filters: AnalyticsFilters = {};
    if (startDateParam) filters.startDate = new Date(startDateParam);
    if (endDateParam) filters.endDate = new Date(endDateParam);
    if (programmeId) filters.programmeId = programmeId;

    // Calculate default date range (last 30 days) if not provided
    const endDate = filters.endDate || new Date();
    const startDate =
      filters.startDate ||
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = startDate;

    // Build date filters for queries
    const dateFilter = {
      gte: startDate,
      lte: endDate,
    };

    const previousDateFilter = {
      gte: previousStartDate,
      lte: previousEndDate,
    };

    // Build programme filter
    const programmeFilter = programmeId ? { courseId: programmeId } : {};

    // Fetch all analytics data in parallel
    const [
      // Overview stats
      totalProgrammes,
      totalActiveProgrammes,
      totalStudents,
      totalLecturers,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      completedInPeriod,

      // Previous period for comparison
      previousEnrollments,

      // Programme analytics
      topProgrammesByEnrollment,
      programmeCompletionRates,

      // Student engagement
      totalSubmissions,
      gradedSubmissions,
      activeStudentsToday,
      activeStudentsWeek,
      loginActivity,
      previousLoginActivity,

      // Content statistics
      totalModules,
      totalLessons,
      totalResources,
      lessonsByType,

      // Progress & Completion
      avgProgressData,
      recentCompletions,

      // Activity trends
      dailyEnrollments,
      dailyLogins,
      weeklyActiveUsers,
    ] = await Promise.all([
      // Overview stats - Total programmes
      prisma.course.count(),

      // Active programmes (published)
      prisma.course.count({
        where: { status: "PUBLISHED" },
      }),

      // Total students
      prisma.user.count({
        where: { role: "STUDENT", status: "ACTIVE" },
      }),

      // Total lecturers
      prisma.user.count({
        where: { role: "LECTURER", status: "ACTIVE" },
      }),

      // Total enrollments (all time, students only)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          user: { role: "STUDENT" },
        },
      }),

      // Active enrollments (current period, students only)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          enrolledAt: dateFilter,
          status: "ACTIVE",
          user: { role: "STUDENT" },
        },
      }),

      // Completed enrollments (all time for completion rate, students only)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          status: "COMPLETED",
          user: { role: "STUDENT" },
        },
      }),

      // Completed enrollments in current period (for display, students only)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          status: "COMPLETED",
          completedAt: dateFilter,
          user: { role: "STUDENT" },
        },
      }),

      // Previous period enrollments for trend (students only)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          enrolledAt: previousDateFilter,
          status: "ACTIVE",
          user: { role: "STUDENT" },
        },
      }),

      // Top programmes by enrollment (in current period, students only)
      prisma.course
        .findMany({
          where: programmeId
            ? { id: programmeId }
            : { status: { not: "ARCHIVED" } },
          select: {
            id: true,
            title: true,
            status: true,
            enrollments: {
              where: {
                enrolledAt: dateFilter,
                user: { role: "STUDENT" },
              },
              select: {
                id: true,
              },
            },
          },
          take: 100, // Fetch more to sort accurately
        })
        .then((courses) =>
          courses
            .map((course) => ({
              id: course.id,
              title: course.title,
              status: course.status,
              enrollments: course.enrollments.length,
            }))
            .sort((a, b) => b.enrollments - a.enrollments)
            .slice(0, programmeId ? 1 : 10),
        ),

      // Programme completion rates (students only)
      prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          totalEnrollments: number;
          completedEnrollments: number;
          averageProgress: number;
        }>
      >`
        SELECT
            c.id,
            c.title,
            COUNT(CASE WHEN u.role = 'STUDENT' THEN 1 END)::int as "totalEnrollments",
            COUNT(CASE WHEN u.role = 'STUDENT' AND ce.status = 'COMPLETED' THEN 1 END)::int as "completedEnrollments",
            COALESCE(AVG(CASE WHEN u.role = 'STUDENT' THEN ce.progress END), 0)::float as "averageProgress"
        FROM "Course" c
        LEFT JOIN "CourseEnrollment" ce ON c.id = ce."courseId" AND ce."enrolledAt" <= ${endDate}
        LEFT JOIN "User" u ON ce."userId" = u.id
        WHERE (${programmeId || null}::text IS NULL OR c.id = ${programmeId || null})
          AND (${programmeId || null}::text IS NOT NULL OR c.status = 'PUBLISHED')
        GROUP BY c.id, c.title
        LIMIT ${programmeId ? 1 : 10}
      `,

      // Total submissions
      prisma.submission.count({
        where: {
          createdAt: dateFilter,
          ...(programmeId
            ? {
                lesson: {
                  module: {
                    courseId: programmeId,
                  },
                },
              }
            : {}),
        },
      }),

      // Graded submissions
      prisma.submission.count({
        where: {
          status: "GRADED",
          gradedAt: dateFilter,
          ...(programmeId
            ? {
                lesson: {
                  module: {
                    courseId: programmeId,
                  },
                },
              }
            : {}),
        },
      }),

      // Active students today (logged in last 24 hours, students only)
      prisma.auditLog
        .findMany({
          where: {
            action: "USER_LOGIN",
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
            user: {
              role: "STUDENT",
            },
          },
          distinct: ["userId"],
          select: { userId: true },
        })
        .then((logs) => logs.length),

      // Active students this week (students only)
      prisma.auditLog
        .findMany({
          where: {
            action: "USER_LOGIN",
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
            user: {
              role: "STUDENT",
            },
          },
          distinct: ["userId"],
          select: { userId: true },
        })
        .then((logs) => logs.length),

      // Login activity (current period)
      prisma.auditLog.count({
        where: {
          action: "USER_LOGIN",
          createdAt: dateFilter,
        },
      }),

      // Previous period login activity
      prisma.auditLog.count({
        where: {
          action: "USER_LOGIN",
          createdAt: previousDateFilter,
        },
      }),

      // Total modules
      prisma.module.count(
        programmeId ? { where: { courseId: programmeId } } : undefined,
      ),

      // Total lessons
      prisma.lesson.count(
        programmeId
          ? {
              where: {
                module: {
                  courseId: programmeId,
                },
              },
            }
          : undefined,
      ),

      // Total resources
      prisma.lessonResource.count(
        programmeId
          ? {
              where: {
                lesson: {
                  module: {
                    courseId: programmeId,
                  },
                },
              },
            }
          : undefined,
      ),

      // Lessons by type
      prisma.lesson.groupBy({
        by: ["type"],
        _count: true,
        where: programmeId
          ? {
              module: {
                courseId: programmeId,
              },
            }
          : undefined,
      }),

      // Average progress across enrollments (students only)
      prisma.courseEnrollment.aggregate({
        where: {
          ...programmeFilter,
          status: "ACTIVE",
          enrolledAt: { lte: endDate },
          user: { role: "STUDENT" },
        },
        _avg: {
          progress: true,
        },
      }),

      // Recent completions (students only)
      prisma.courseEnrollment.findMany({
        where: {
          ...programmeFilter,
          status: "COMPLETED",
          completedAt: dateFilter,
          user: { role: "STUDENT" },
        },
        select: {
          id: true,
          completedAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 10,
      }),

      // Daily enrollments trend (last 30 days from endDate, students only)
      programmeId
        ? prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT 
            DATE(ce."enrolledAt") as date,
            COUNT(*)::bigint as count
          FROM "CourseEnrollment" ce
          JOIN "User" u ON ce."userId" = u."id"
          WHERE ce."enrolledAt" >= ${new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)}
            AND ce."enrolledAt" <= ${endDate}
            AND ce."courseId" = ${programmeId}
            AND u."role" = 'STUDENT'
          GROUP BY DATE(ce."enrolledAt")
          ORDER BY date ASC
        `
        : prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT 
            DATE(ce."enrolledAt") as date,
            COUNT(*)::bigint as count
          FROM "CourseEnrollment" ce
          JOIN "User" u ON ce."userId" = u."id"
          WHERE ce."enrolledAt" >= ${new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)}
            AND ce."enrolledAt" <= ${endDate}
            AND u."role" = 'STUDENT'
          GROUP BY DATE(ce."enrolledAt")
          ORDER BY date ASC
        `,

      // Daily logins trend (last 30 days)
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT 
          DATE("createdAt") as date,
          COUNT(DISTINCT "userId")::bigint as count
        FROM "AuditLog"
        WHERE action = 'USER_LOGIN'
          AND "createdAt" >= ${new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // Weekly active users (last 12 weeks)
      prisma.$queryRaw<Array<{ week: Date; count: bigint }>>`
        SELECT 
          DATE_TRUNC('week', "createdAt") as week,
          COUNT(DISTINCT "userId")::bigint as count
        FROM "AuditLog"
        WHERE action = 'USER_LOGIN'
          AND "createdAt" >= ${new Date(endDate.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('week', "createdAt")
        ORDER BY week ASC
      `,
    ]);

    // Calculate trends and percentages
    const enrollmentTrend =
      previousEnrollments > 0
        ? ((activeEnrollments - previousEnrollments) / previousEnrollments) *
          100
        : activeEnrollments > 0
          ? 100
          : 0;

    const loginTrend =
      previousLoginActivity > 0
        ? ((loginActivity - previousLoginActivity) / previousLoginActivity) *
          100
        : loginActivity > 0
          ? 100
          : 0;

    const completionRate =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    const avgProgress = avgProgressData._avg.progress || 0;

    // Calculate programme performance metrics
    const programmePerformance = programmeCompletionRates.map((programme) => {
      return {
        id: programme.id,
        title: programme.title,
        totalEnrollments: programme.totalEnrollments,
        completedEnrollments: programme.completedEnrollments,
        completionRate:
          programme.totalEnrollments > 0
            ? (programme.completedEnrollments / programme.totalEnrollments) *
              100
            : 0,
        averageProgress: programme.averageProgress,
      };
    });

    // Process lessons by type
    const lessonTypeDistribution = lessonsByType.map((item) => ({
      type: item.type,
      count: item._count,
    }));

    // Build response
    const analytics = {
      overview: {
        totalProgrammes,
        activeProgrammes: totalActiveProgrammes,
        totalStudents,
        totalLecturers,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments: completedInPeriod,
        completionRate: Math.round(completionRate * 10) / 10,
        enrollmentTrend: Math.round(enrollmentTrend * 10) / 10,
        averageProgress: Math.round(avgProgress * 10) / 10,
      },
      engagement: {
        activeStudentsToday,
        activeStudentsWeek,
        totalLogins: loginActivity,
        loginTrend: Math.round(loginTrend * 10) / 10,
        totalSubmissions,
        gradedSubmissions,
        submissionGradingRate:
          totalSubmissions > 0
            ? Math.round((gradedSubmissions / totalSubmissions) * 1000) / 10
            : 0,
      },
      programmes: {
        topByEnrollment: topProgrammesByEnrollment.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          enrollments: p.enrollments,
        })),
        performance: programmePerformance,
      },
      content: {
        totalModules,
        totalLessons,
        totalResources,
        lessonTypeDistribution,
      },
      trends: {
        dailyEnrollments: dailyEnrollments.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
        dailyLogins: dailyLogins.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
        weeklyActiveUsers: weeklyActiveUsers.map((w) => ({
          week: w.week,
          count: Number(w.count),
        })),
      },
      recentActivity: {
        recentCompletions: recentCompletions.map((c) => ({
          id: c.id,
          completedAt: c.completedAt,
          studentName: c.user.name || c.user.email,
          programmeTitle: c.course.title,
        })),
      },
      filters: {
        startDate,
        endDate,
        programmeId: programmeId || null,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}
