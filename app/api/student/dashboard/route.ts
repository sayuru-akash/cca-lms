import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeadlinePassed } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can access their dashboard
    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userId = session.user.id;

    // Parallelize independent queries to improve performance
    // Bolt: Batched 4 independent DB queries into a single Promise.all
    const [enrollments, lessonProgress, recentCompletions, upcomingAssignments] =
      await Promise.all([
        // Fetch student's enrollments with course details
        prisma.courseEnrollment.findMany({
          where: {
            userId,
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
          include: {
            course: {
              include: {
                modules: {
                  orderBy: { order: "asc" },
                  include: {
                    lessons: {
                      orderBy: { order: "asc" },
                      select: {
                        id: true,
                        title: true,
                        type: true,
                        duration: true,
                        isPublished: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { lastAccessedAt: "desc" },
        }),

        // Fetch lesson progress for the student
        prisma.lessonProgress.findMany({
          where: { userId },
          select: {
            lessonId: true,
            completed: true,
            watchedSeconds: true,
            lastAccessedAt: true,
          },
        }),

        // Get recent activity (completed lessons)
        prisma.lessonProgress.findMany({
          where: {
            userId,
            completed: true,
          },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                module: {
                  select: {
                    title: true,
                    course: {
                      select: {
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { lastAccessedAt: "desc" },
          take: 10,
        }),

        // Fetch upcoming assignments
        prisma.assignment.findMany({
          where: {
            lesson: {
              module: {
                course: {
                  enrollments: {
                    some: {
                      userId,
                      status: "ACTIVE",
                    },
                  },
                },
              },
            },
            dueDate: {
              gte: new Date(),
            },
            // Only show assignments without submissions or draft submissions
            assignmentSubmissions: {
              none: {
                userId,
                status: {
                  in: ["SUBMITTED", "GRADED"],
                },
              },
            },
          },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                module: {
                  select: {
                    title: true,
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
            assignmentSubmissions: {
              where: { userId },
              select: {
                status: true,
              },
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 5,
        }),
      ]);

    // Create a map for quick lesson progress lookup
    const progressMap = new Map(lessonProgress.map((p) => [p.lessonId, p]));

    // Calculate next lessons and format programme data
    const programmes = enrollments.map((enrollment) => {
      const course = enrollment.course;

      // Get all lessons across modules
      const allLessons = course.modules.flatMap((module) =>
        module.lessons
          .filter((l) => l.isPublished)
          .map((lesson) => ({
            ...lesson,
            moduleTitle: module.title,
            moduleId: module.id,
          })),
      );

      // Find next incomplete lesson
      const nextLesson = allLessons.find((lesson) => {
        const progress = progressMap.get(lesson.id);
        return !progress?.completed;
      });

      // Calculate completion stats
      const totalLessons = allLessons.length;
      const completedLessons = allLessons.filter((lesson) => {
        const progress = progressMap.get(lesson.id);
        return progress?.completed;
      }).length;

      // Get last accessed lesson
      const lastAccessedLesson = allLessons
        .map((lesson) => ({
          ...lesson,
          lastAccessed: progressMap.get(lesson.id)?.lastAccessedAt,
        }))
        .filter((l) => l.lastAccessed)
        .sort(
          (a, b) =>
            new Date(b.lastAccessed!).getTime() -
            new Date(a.lastAccessed!).getTime(),
        )[0];

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        progress: enrollment.progress,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        totalModules: course.modules.length,
        totalLessons,
        completedLessons,
        nextLesson: nextLesson
          ? {
              id: nextLesson.id,
              title: nextLesson.title,
              moduleTitle: nextLesson.moduleTitle,
              type: nextLesson.type,
              duration: nextLesson.duration,
            }
          : null,
        lastAccessedLesson: lastAccessedLesson
          ? {
              id: lastAccessedLesson.id,
              title: lastAccessedLesson.title,
              moduleTitle: lastAccessedLesson.moduleTitle,
            }
          : null,
      };
    });

    const recentActivity = recentCompletions.map((completion) => ({
      id: completion.id,
      type: "LESSON_COMPLETED",
      lessonTitle: completion.lesson.title,
      moduleTitle: completion.lesson.module.title,
      courseTitle: completion.lesson.module.course.title,
      timestamp: completion.lastAccessedAt,
    }));

    // Calculate overall stats
    const totalEnrolled = enrollments.length;
    const totalCompleted = enrollments.filter(
      (e) => e.status === "COMPLETED",
    ).length;
    const averageProgress =
      totalEnrolled > 0
        ? enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrolled
        : 0;

    return NextResponse.json({
      programmes,
      recentActivity,
      upcomingAssignments: upcomingAssignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        courseTitle: assignment.lesson.module.course.title,
        lessonTitle: assignment.lesson.title,
        courseId: assignment.lesson.module.course.id,
        lessonId: assignment.lesson.id,
        isOverdue: isDeadlinePassed(assignment.dueDate),
        daysUntilDue: Math.ceil(
          (assignment.dueDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      })),
      stats: {
        totalEnrolled,
        totalCompleted,
        inProgress: totalEnrolled - totalCompleted,
        averageProgress: Math.round(averageProgress),
      },
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
