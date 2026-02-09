import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendAssignmentGradedEmail } from "@/lib/resend";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/submissions/[id] - Get submission details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignment: {
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
                        lecturers: {
                          select: {
                            lecturerId: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        attachments: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      const isAssigned =
        submission.assignment.lesson.module.course.lecturers.some(
          (l) => l.lecturerId === session.user.id,
        );
      if (!isAssigned) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error fetching submission:", error);

    let errorMessage = "Failed to load submission details.";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        errorMessage = "Submission not found.";
        statusCode = 404;
      } else if (error.message.includes("permission")) {
        errorMessage = "Access denied to this submission.";
        statusCode = 403;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// PUT /api/admin/submissions/[id] - Grade submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { grade, feedback, status } = body;

    // Get submission with ownership info
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: {
                      select: {
                        lecturers: {
                          where: { lecturerId: session.user.id },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      if (
        existingSubmission.assignment.lesson.module.course.lecturers.length ===
        0
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Validate grade
    if (grade !== undefined) {
      const maxGrade =
        existingSubmission.maxGrade || existingSubmission.assignment.maxPoints;
      if (grade < 0 || grade > maxGrade) {
        return NextResponse.json(
          { error: `Grade must be between 0 and ${maxGrade}` },
          { status: 400 },
        );
      }
    }

    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id },
      data: {
        ...(grade !== undefined && { grade }),
        ...(feedback !== undefined && { feedback }),
        ...(status !== undefined && { status }),
        ...(status === "GRADED" && { gradedAt: new Date() }),
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
          include: {
            lesson: {
              include: {
                module: {
                  include: {
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
    });

    // Send graded email notification
    if (status === "GRADED" && grade !== undefined) {
      try {
        await sendAssignmentGradedEmail({
          studentName:
            updatedSubmission.user.name || updatedSubmission.user.email,
          studentEmail: updatedSubmission.user.email,
          assignmentTitle: updatedSubmission.assignment.title,
          courseTitle:
            updatedSubmission.assignment.lesson.module.course.title,
          grade,
          maxPoints: updatedSubmission.assignment.maxPoints,
          feedback: feedback || undefined,
          assignmentId: updatedSubmission.assignment.id,
        });
      } catch (error) {
        console.error("Failed to send grading notification email:", error);
      }
    }

    await createAuditLog({
      userId: session.user.id,
      action: "ASSIGNMENT_GRADED",
      entityType: "AssignmentSubmission",
      entityId: updatedSubmission.id,
      metadata: {
        grade,
        studentEmail: updatedSubmission.user.email,
        assignmentTitle: updatedSubmission.assignment.title,
      },
    });

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: "Submission graded successfully",
    });
  } catch (error) {
    console.error("Error grading submission:", error);

    let errorMessage = "Failed to save grade. Please try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("not found")) {
        errorMessage = "Submission not found. It may have been deleted.";
        statusCode = 404;
      } else if (
        msg.includes("unique constraint") ||
        msg.includes("duplicate")
      ) {
        errorMessage = "This submission has already been graded.";
        statusCode = 409;
      } else if (msg.includes("permission") || msg.includes("unauthorized")) {
        errorMessage = "You don't have permission to grade this submission.";
        statusCode = 403;
      } else if (error.message.length < 150) {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
