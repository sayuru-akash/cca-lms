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
    const { enrollments } = body as { enrollments: EnrollmentData[] };

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

    // Get existing enrollments to avoid duplicates
    const userIds = enrollments.map((e) => e.userId);
    const programmeIds = enrollments.map((e) => e.programmeId);

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

    const enrollmentSet = new Set(
      existingEnrollments.map((e) => `${e.userId}-${e.courseId}`),
    );

    // Filter out duplicates
    const newEnrollments = enrollments.filter(
      (e) => !enrollmentSet.has(`${e.userId}-${e.programmeId}`),
    );

    if (newEnrollments.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: enrollments.length,
        message: "All enrollments already exist",
      });
    }

    // Create enrollments in a transaction
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

    // Audit log for each enrollment
    await Promise.all(
      created.map((enrollment) =>
        auditActions.programmeEnrollmentCreated(
          session.user.id,
          enrollment.id,
          enrollment.course.title,
        ),
      ),
    );

    return NextResponse.json({
      created: created.length,
      skipped: enrollments.length - newEnrollments.length,
      message: `Successfully enrolled ${created.length} user(s)`,
    });
  } catch (error) {
    console.error("Error creating bulk enrollments:", error);
    return NextResponse.json(
      { error: "Failed to create enrollments" },
      { status: 500 },
    );
  }
}
