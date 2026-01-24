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

    // Get lecturer's courses
    const courses = await prisma.course.findMany({
      where: {
        lecturerId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    // Get total enrolled students across all courses
    const totalStudents = await prisma.courseEnrollment.count({
      where: {
        course: {
          lecturerId,
        },
        status: {
          in: ["ACTIVE", "COMPLETED"],
        },
      },
    });

    // Get total modules
    const totalModules = await prisma.module.count({
      where: {
        course: {
          lecturerId,
        },
      },
    });

    // Get recent enrollments
    const recentEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        course: {
          lecturerId,
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
    });

    return NextResponse.json({
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalModules,
        publishedCourses: courses.filter((c) => c.status === "PUBLISHED")
          .length,
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
    });
  } catch (error) {
    console.error("Error fetching lecturer dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
