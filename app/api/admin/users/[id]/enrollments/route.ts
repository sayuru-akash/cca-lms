import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditActions } from "@/lib/audit";

// GET /api/admin/users/[id]/enrollments - Get user's programme enrollments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a lecturer or student
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For lecturers, get CourseLecturer assignments
    if (user.role === "LECTURER") {
      const assignments = await prisma.courseLecturer.findMany({
        where: { lecturerId: id },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              thumbnail: true,
              _count: {
                select: {
                  modules: true,
                },
              },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      });

      // Format to match enrollment structure
      const enrollments = assignments.map((a) => ({
        id: a.id,
        status: "ACTIVE",
        progress: 0,
        enrolledAt: a.assignedAt.toISOString(),
        completedAt: null,
        course: a.course,
      }));

      return NextResponse.json({ enrollments });
    }

    // For students, get user enrollments
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            thumbnail: true,
            _count: {
              select: {
                modules: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 },
    );
  }
}

// POST /api/admin/users/[id]/enrollments - Assign programme(s) to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { courseIds } = body;

    // Validation
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: "At least one programme must be selected" },
        { status: 400 },
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle differently based on user role
    if (user.role === "LECTURER") {
      // For lecturers, create CourseLecturer assignments
      const existingAssignments = await prisma.courseLecturer.findMany({
        where: {
          lecturerId: userId,
          courseId: { in: courseIds },
        },
        select: { courseId: true },
      });

      const existingCourseIds = new Set(
        existingAssignments.map((a) => a.courseId),
      );
      const newCourseIds = courseIds.filter(
        (id) => !existingCourseIds.has(id),
      );

      // Create new lecturer assignments
      if (newCourseIds.length > 0) {
        await prisma.courseLecturer.createMany({
          data: newCourseIds.map((courseId) => ({
            courseId,
            lecturerId: userId,
            assignedBy: session.user.id,
          })),
        });
      }

      return NextResponse.json({
        lecturerAssignments: newCourseIds.length,
        skipped: existingCourseIds.size,
        message:
          newCourseIds.length > 0
            ? `Successfully assigned ${newCourseIds.length} programme(s) to lecturer${existingCourseIds.size > 0 ? ` (${existingCourseIds.size} already assigned)` : ""}`
            : "All selected programmes were already assigned",
      });
    }

    // For students, create CourseEnrollment records
    const existingEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId,
        courseId: { in: courseIds },
      },
      select: { courseId: true },
    });

    const existingCourseIds = new Set(
      existingEnrollments.map((e) => e.courseId),
    );
    const newCourseIds = courseIds.filter((id) => !existingCourseIds.has(id));

    // Create new enrollments
    const enrollments = await prisma.$transaction(
      newCourseIds.map((courseId) =>
        prisma.courseEnrollment.create({
          data: {
            userId,
            courseId,
            status: "ACTIVE",
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        }),
      ),
    );

    // Audit log for each enrollment
    await Promise.all(
      enrollments.map((enrollment) =>
        auditActions.programmeEnrollmentCreated(
          session.user.id,
          enrollment.id,
          enrollment.course.title,
        ),
      ),
    );

    return NextResponse.json({
      enrollments,
      skipped: existingCourseIds.size,
      message:
        newCourseIds.length > 0
          ? `Successfully assigned ${newCourseIds.length} programme(s)${existingCourseIds.size > 0 ? ` (${existingCourseIds.size} already enrolled)` : ""}`
          : "All selected programmes were already assigned",
    });
  } catch (error) {
    console.error("Error creating enrollments:", error);
    return NextResponse.json(
      { error: "Failed to assign programmes" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users/[id]/enrollments - Remove programme enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Programme ID is required" },
        { status: 400 },
      );
    }

    // Check if user is a lecturer or student
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For lecturers, delete CourseLecturer assignment
    if (user.role === "LECTURER") {
      const assignment = await prisma.courseLecturer.findUnique({
        where: {
          courseId_lecturerId: {
            courseId,
            lecturerId: userId,
          },
        },
        include: {
          course: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Lecturer assignment not found" },
          { status: 404 },
        );
      }

      await prisma.courseLecturer.delete({
        where: {
          courseId_lecturerId: {
            courseId,
            lecturerId: userId,
          },
        },
      });

      return NextResponse.json({
        message: "Lecturer assignment removed successfully",
      });
    }

    // For students, delete CourseEnrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 },
      );
    }

    // Delete enrollment
    await prisma.courseEnrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    // Audit log
    await auditActions.programmeEnrollmentDeleted(
      session.user.id,
      enrollment.id,
      enrollment.course.title,
    );

    return NextResponse.json({
      message: "Programme enrollment removed successfully",
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json(
      { error: "Failed to remove programme enrollment" },
      { status: 500 },
    );
  }
}
