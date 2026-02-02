import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditActions } from "@/lib/audit";

interface EnrollmentData {
  userId: string;
  programmeId: string;
  status: "valid";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollments, userType } = body as {
      enrollments: EnrollmentData[];
      userType: "STUDENT" | "LECTURER";
    };

    if (
      !enrollments ||
      !Array.isArray(enrollments) ||
      enrollments.length === 0
    ) {
      return NextResponse.json(
        { error: "No valid enrollments to process" },
        { status: 400 },
      );
    }

    // Get existing enrollments/assignments to avoid duplicates
    const userIds = enrollments.map((e) => e.userId);
    const programmeIds = enrollments.map((e) => e.programmeId);

    let enrollmentSet: Set<string>;
    let newEnrollments: EnrollmentData[];

    if (userType === "LECTURER") {
      // For lecturers, check CourseLecturer table
      const existingAssignments = await prisma.courseLecturer.findMany({
        where: {
          lecturerId: { in: userIds },
          courseId: { in: programmeIds },
        },
        select: {
          lecturerId: true,
          courseId: true,
        },
      });

      enrollmentSet = new Set(
        existingAssignments.map((a) => `${a.lecturerId}-${a.courseId}`),
      );

      newEnrollments = enrollments.filter(
        (e) => !enrollmentSet.has(`${e.userId}-${e.programmeId}`),
      );

      if (newEnrollments.length === 0) {
        return NextResponse.json({
          created: 0,
          skipped: enrollments.length,
          message: "All lecturer assignments already exist",
        });
      }

      // Create lecturer assignments
      await prisma.courseLecturer.createMany({
        data: newEnrollments.map((enrollment) => ({
          lecturerId: enrollment.userId,
          courseId: enrollment.programmeId,
          assignedBy: session.user.id,
        })),
      });

      // Get created assignments for audit log
      const created = await prisma.courseLecturer.findMany({
        where: {
          lecturerId: { in: newEnrollments.map((e) => e.userId) },
          courseId: { in: newEnrollments.map((e) => e.programmeId) },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Audit log for assignments
      await auditActions.programmeEnrollmentsCreated(session.user.id, created);

      return NextResponse.json({
        created: created.length,
        skipped: enrollments.length - newEnrollments.length,
        message: `Successfully assigned ${created.length} lecturer(s) to programmes`,
      });
    } else {
      // For students, check CourseEnrollment table
      const existingEnrollments = await prisma.courseEnrollment.findMany({
        where: {
          userId: { in: userIds },
          courseId: { in: programmeIds },
        },
        select: {
          userId: true,
          courseId: true,
        },
      });

      enrollmentSet = new Set(
        existingEnrollments.map((e) => `${e.userId}-${e.courseId}`),
      );

      newEnrollments = enrollments.filter(
        (e) => !enrollmentSet.has(`${e.userId}-${e.programmeId}`),
      );

      if (newEnrollments.length === 0) {
        return NextResponse.json({
          created: 0,
          skipped: enrollments.length,
          message: "All enrollments already exist",
        });
      }

      // Create student enrollments
      const created = await prisma.$transaction(
        newEnrollments.map((enrollment) =>
          prisma.courseEnrollment.create({
            data: {
              userId: enrollment.userId,
              courseId: enrollment.programmeId,
              status: "ACTIVE",
            },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }),
        ),
      );

      // Audit log for enrollments
      await auditActions.programmeEnrollmentsCreated(session.user.id, created);

      return NextResponse.json({
        created: created.length,
        skipped: enrollments.length - newEnrollments.length,
        message: `Successfully enrolled ${created.length} student(s)`,
      });
    }
  } catch (error) {
    console.error("Error creating bulk enrollments:", error);
    return NextResponse.json(
      { error: "Failed to create enrollments" },
      { status: 500 },
    );
  }
}
