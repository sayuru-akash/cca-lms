import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = session.user.id;

    // Parallelize independent queries to improve performance
    // Bolt: Batched 6 independent DB queries into a single Promise.all
    const [
      courses,
      totalStudents,
      totalModules,
      recentEnrollments,
      pendingGrading,
      pendingSubmissions,
    ] = await Promise.all([
      // Get lecturer's courses from CourseLecturer table
      prisma.course.findMany({
        where: {
          lecturers: {
            some: {
              lecturerId,
            },
          },
        },
        include: {
          _count: {
            select: {
              enrollments: {
                where: {
                  user: {
                    role: "STUDENT",
                  },
                },
              },
              modules: true,
            },
          },
        },
      }),

      // Get total enrolled students across all courses (students only)
      prisma.courseEnrollment.count({
        where: {
          course: {
            lecturers: {
              some: {
                lecturerId,
              },
            },
          },
          status: {
            in: ["ACTIVE", "COMPLETED"],
          },
          user: {
            role: "STUDENT",
          },
        },
      }),

      // Get total modules
      prisma.module.count({
        where: {
          course: {
            lecturers: {
              some: {
                lecturerId,
              },
            },
          },
        },
      }),

      // Get recent enrollments (students only)
      prisma.courseEnrollment.findMany({
        where: {
          course: {
            lecturers: {
              some: {
                lecturerId,
              },
            },
          },
          user: {
            role: "STUDENT",
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          enrolledAt: "desc",
        },
        take: 5,
      }),

      // Get pending grading count
      prisma.assignmentSubmission.count({
        where: {
          assignment: {
            lesson: {
              module: {
                course: {
                  lecturers: {
                    some: {
                      lecturerId,
                    },
                  },
                },
              },
            },
          },
          status: "SUBMITTED",
          grade: null,
        },
      }),

      // Get recent submissions requiring grading
      prisma.assignmentSubmission.findMany({
        where: {
          assignment: {
            lesson: {
              module: {
                course: {
                  lecturers: {
                    some: {
                      lecturerId,
                    },
                  },
                },
              },
            },
          },
          status: "SUBMITTED",
          grade: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              maxPoints: true,
              lesson: {
                select: {
                  title: true,
                  module: {
                    select: {
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
          },
        },
        orderBy: {
          submittedAt: "asc",
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalModules,
        publishedCourses: courses.filter((c) => c.status === "PUBLISHED")
          .length,
        pendingGrading,
      },
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        enrollmentCount: course._count.enrollments,
        moduleCount: course._count.modules,
        createdAt: course.createdAt,
      })),
      recentEnrollments: recentEnrollments.map((enrollment) => ({
        id: enrollment.id,
        studentName: enrollment.user.name,
        studentEmail: enrollment.user.email,
        courseTitle: enrollment.course.title,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
      })),
      pendingSubmissions: pendingSubmissions.map((submission) => ({
        id: submission.id,
        studentName: submission.user.name,
        assignmentTitle: submission.assignment.title,
        courseTitle: submission.assignment.lesson.module.course.title,
        submittedAt: submission.submittedAt,
        dueDate: submission.assignment.dueDate,
        maxPoints: submission.assignment.maxPoints,
        isLate: submission.submittedAt
          ? submission.submittedAt > submission.assignment.dueDate
          : false,
      })),
    });
  } catch (error) {
    console.error("Error fetching lecturer dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
