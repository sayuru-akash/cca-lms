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

      // Total enrollments (all time)
      prisma.courseEnrollment.count(
        programmeId ? { where: programmeFilter } : undefined,
      ),

      // Active enrollments (current period)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          enrolledAt: dateFilter,
          status: "ACTIVE",
        },
      }),

      // Completed enrollments (all time for completion rate)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          status: "COMPLETED",
        },
      }),

      // Completed enrollments in current period (for display)
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          status: "COMPLETED",
          completedAt: dateFilter,
        },
      }),

      // Previous period enrollments for trend
      prisma.courseEnrollment.count({
        where: {
          ...programmeFilter,
          enrolledAt: previousDateFilter,
          status: "ACTIVE",
        },
      }),

      // Top programmes by enrollment (in current period)
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

      // Programme completion rates
      prisma.course.findMany({
        where: programmeId ? { id: programmeId } : { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          enrollments: {
            where: {
              enrolledAt: { lte: endDate },
            },
            select: {
              status: true,
              progress: true,
            },
          },
        },
        take: programmeId ? 1 : 10,
      }),

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

      // Active students today (logged in last 24 hours)
      prisma.auditLog
        .findMany({
          where: {
            action: "USER_LOGIN",
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          distinct: ["userId"],
          select: { userId: true },
        })
        .then((logs) => logs.length),

      // Active students this week
      prisma.auditLog
        .findMany({
          where: {
            action: "USER_LOGIN",
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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

      // Average progress across enrollments
      prisma.courseEnrollment.aggregate({
        where: {
          ...programmeFilter,
          status: "ACTIVE",
          enrolledAt: { lte: endDate },
        },
        _avg: {
          progress: true,
        },
      }),

      // Recent completions
      prisma.courseEnrollment.findMany({
        where: {
          ...programmeFilter,
          status: "COMPLETED",
          completedAt: dateFilter,
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

      // Daily enrollments trend (last 30 days from endDate)
      programmeId
        ? prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT 
            DATE("enrolledAt") as date,
            COUNT(*)::bigint as count
          FROM "CourseEnrollment"
          WHERE "enrolledAt" >= ${new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)}
            AND "enrolledAt" <= ${endDate}
            AND "courseId" = ${programmeId}
          GROUP BY DATE("enrolledAt")
          ORDER BY date ASC
        `
        : prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT 
            DATE("enrolledAt") as date,
            COUNT(*)::bigint as count
          FROM "CourseEnrollment"
          WHERE "enrolledAt" >= ${new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)}
            AND "enrolledAt" <= ${endDate}
          GROUP BY DATE("enrolledAt")
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
      const total = programme.enrollments.length;
      const completed = programme.enrollments.filter(
        (e) => e.status === "COMPLETED",
      ).length;
      const avgProgrammeProgress =
        total > 0
          ? programme.enrollments.reduce(
              (sum, e) => sum + (e.progress || 0),
              0,
            ) / total
          : 0;

      return {
        id: programme.id,
        title: programme.title,
        totalEnrollments: total,
        completedEnrollments: completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        averageProgress: avgProgrammeProgress,
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
