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

    // Get all students enrolled in lecturer's courses
    const enrollments = await prisma.courseEnrollment.findMany({
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
            createdAt: true,
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
    });

    // Get unique students with their course enrollments
    const studentsMap = new Map();

    for (const enrollment of enrollments) {
      const studentId = enrollment.user.id;

      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          id: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          joinDate: enrollment.user.createdAt,
          enrolledCourses: [],
          totalProgress: 0,
          completedCourses: 0,
        });
      }

      const student = studentsMap.get(studentId);
      student.enrolledCourses.push({
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        status: enrollment.status,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
      });

      student.totalProgress += enrollment.progress;
      if (enrollment.status === "COMPLETED") {
        student.completedCourses += 1;
      }
    }

    // Convert to array and calculate average progress
    const students = Array.from(studentsMap.values()).map((student) => ({
      ...student,
      averageProgress:
        student.enrolledCourses.length > 0
          ? Math.round(student.totalProgress / student.enrolledCourses.length)
          : 0,
      enrolledCoursesCount: student.enrolledCourses.length,
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
