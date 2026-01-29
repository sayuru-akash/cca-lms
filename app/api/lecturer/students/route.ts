import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // First, get all unique student IDs enrolled in lecturer's courses
    const allStudentEnrollments = await prisma.courseEnrollment.findMany({
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
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    const allStudentIds = allStudentEnrollments.map((e) => e.userId);
    const totalStudents = allStudentIds.length;

    // Paginate the student IDs
    const paginatedStudentIds = allStudentIds.slice(offset, offset + limit);

    // If no students on this page, return empty result
    if (paginatedStudentIds.length === 0) {
      return NextResponse.json({
        students: [],
        pagination: {
          page,
          limit,
          totalCount: totalStudents,
          totalPages: Math.ceil(totalStudents / limit),
          hasNext: page < Math.ceil(totalStudents / limit),
          hasPrev: page > 1,
        },
      });
    }

    // Get all enrollments for the paginated students
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: { in: paginatedStudentIds },
        course: {
          lecturers: {
            some: {
              lecturerId,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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

    const totalPages = Math.ceil(totalStudents / limit);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        totalCount: totalStudents,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
