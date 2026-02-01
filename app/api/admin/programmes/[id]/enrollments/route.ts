import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditActions } from "@/lib/audit";

// GET /api/admin/programmes/[id]/enrollments - Get programme enrollments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role"); // STUDENT or LECTURER

    // Get lecturer assignments
    const lecturerAssignments = await prisma.courseLecturer.findMany({
      where: {
        courseId,
      },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    // Get student enrollments
    const studentEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Combine and format results
    const lecturerData = lecturerAssignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.lecturerId,
      courseId: assignment.courseId,
      enrolledAt: assignment.assignedAt,
      progress: null, // Lecturers don't have progress
      user: assignment.lecturer,
      status: "ACTIVE",
    }));

    const studentData = studentEnrollments.map((enrollment) => ({
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress, // Add the missing progress field
      user: enrollment.user,
      status: enrollment.status,
    }));

    // Filter by role if requested
    let enrollments;
    if (roleFilter === "LECTURER") {
      enrollments = lecturerData;
    } else if (roleFilter === "STUDENT") {
      enrollments = studentData;
    } else {
      // Combine both, sorted by date
      enrollments = [...lecturerData, ...studentData].sort(
        (a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime(),
      );
    }

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Error fetching programme enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 },
    );
  }
}

// POST /api/admin/programmes/[id]/enrollments - Enroll users to programme
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const { userIds } = body;

    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "At least one user must be selected" },
        { status: 400 },
      );
    }

    // Get course info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Programme not found" },
        { status: 404 },
      );
    }

    // Get users to determine their roles
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true, name: true, email: true },
    });

    const lecturerIds = users
      .filter((u) => u.role === "LECTURER")
      .map((u) => u.id);
    const studentIds = users
      .filter((u) => u.role === "STUDENT")
      .map((u) => u.id);

    let lecturerAssignments = 0;
    let studentEnrollments = 0;
    let skipped = 0;

    // Handle lecturers - create CourseLecturer entries
    if (lecturerIds.length > 0) {
      // Check existing lecturer assignments
      const existingLecturers = await prisma.courseLecturer.findMany({
        where: {
          courseId,
          lecturerId: { in: lecturerIds },
        },
        select: { lecturerId: true },
      });

      const existingLecturerIds = new Set(
        existingLecturers.map((e) => e.lecturerId),
      );
      const newLecturerIds = lecturerIds.filter(
        (id) => !existingLecturerIds.has(id),
      );

      // Create new lecturer assignments
      if (newLecturerIds.length > 0) {
        await prisma.courseLecturer.createMany({
          data: newLecturerIds.map((lecturerId) => ({
            courseId,
            lecturerId,
            assignedBy: session.user.id,
          })),
        });
        lecturerAssignments = newLecturerIds.length;
      }
      skipped += existingLecturerIds.size;
    }

    // Handle students - create CourseEnrollment entries
    if (studentIds.length > 0) {
      // Get existing enrollments to avoid duplicates
      const existingEnrollments = await prisma.courseEnrollment.findMany({
        where: {
          courseId,
          userId: { in: studentIds },
        },
        select: { userId: true },
      });

      const existingUserIds = new Set(existingEnrollments.map((e) => e.userId));
      const newUserIds = studentIds.filter((id) => !existingUserIds.has(id));

      // Create new enrollments
      if (newUserIds.length > 0) {
        const enrollments = await prisma.$transaction(
          newUserIds.map((userId) =>
            prisma.courseEnrollment.create({
              data: {
                userId,
                courseId,
                status: "ACTIVE",
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
              course.title,
            ),
          ),
        );
        studentEnrollments = newUserIds.length;
      }
      skipped += existingUserIds.size;
    }

    const totalAdded = lecturerAssignments + studentEnrollments;
    let message = "";

    if (totalAdded > 0) {
      const parts = [];
      if (lecturerAssignments > 0) {
        parts.push(`${lecturerAssignments} lecturer(s) assigned`);
      }
      if (studentEnrollments > 0) {
        parts.push(`${studentEnrollments} student(s) enrolled`);
      }
      message = `Successfully ${parts.join(" and ")}`;
      if (skipped > 0) {
        message += ` (${skipped} already added)`;
      }
    } else {
      message = "All selected users were already added";
    }

    return NextResponse.json({
      lecturerAssignments,
      studentEnrollments,
      skipped,
      message,
    });
  } catch (error) {
    console.error("Error creating enrollments:", error);
    return NextResponse.json(
      { error: "Failed to enroll users" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/programmes/[id]/enrollments - Remove user enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Check user role
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

      // Audit log
      await auditActions.programmeEnrollmentDeleted(
        session.user.id,
        assignment.id,
        assignment.course.title,
      );

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
      message: "User enrollment removed successfully",
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json(
      { error: "Failed to remove enrollment" },
      { status: 500 },
    );
  }
}
