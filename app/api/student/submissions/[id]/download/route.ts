import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getB2SignedUrl } from "@/lib/b2";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/student/submissions/[id]/download - Download submission file
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey");

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 },
      );
    }

    // Get attachment to verify ownership
    const attachment = await prisma.assignmentSubmissionAttachment.findFirst({
      where: {
        submissionId: id,
        fileKey: fileKey,
      },
      include: {
        submission: {
          include: {
            assignment: {
              include: {
                lesson: {
                  include: {
                    module: {
                      include: {
                        course: {
                          include: {
                            lecturers: true,
                            enrollments: {
                              where: {
                                userId: session.user.id,
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
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = attachment.submission.user.id === session.user.id;
    const isLecturer =
      session.user.role === "LECTURER" &&
      attachment.submission.assignment.lesson.module.course.lecturers.some(
        (l) => l.lecturerId === session.user.id,
      );
    const isAdmin = session.user.role === "ADMIN";
    const isEnrolled =
      attachment.submission.assignment.lesson.module.course.enrollments.length >
      0;

    if (!isOwner && !isLecturer && !isAdmin && !isEnrolled) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate signed URL
    const signedUrl = await getB2SignedUrl(fileKey, 3600); // 1 hour expiry

    return NextResponse.json({ url: signedUrl, fileName: attachment.fileName });
  } catch (error) {
    console.error("Error getting download URL:", error);

    let errorMessage = "Failed to generate download link. Please try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("not found") || msg.includes("does not exist")) {
        errorMessage = "File no longer exists in storage.";
        statusCode = 404;
      } else if (msg.includes("auth") || msg.includes("permission")) {
        errorMessage = "Access denied. Please try logging in again.";
        statusCode = 403;
      } else if (msg.includes("expired")) {
        errorMessage = "Download link expired. Please try again.";
      } else if (error.message.length < 150) {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
