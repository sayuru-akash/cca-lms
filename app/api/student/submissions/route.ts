import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToB2, deleteFromB2 } from "@/lib/b2";
import { createAuditLog } from "@/lib/audit";
import { isDeadlinePassed } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

// POST /api/student/submissions - Create or update submission
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const assignmentId = formData.get("assignmentId") as string;
    const rawContent = formData.get("content") as string | null;
    const content = rawContent ? sanitizeHtml(rawContent) : null;
    const files = formData.getAll("files") as File[];

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 },
      );
    }

    // Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          select: {
            module: {
              select: {
                course: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check enrollment using the same pattern as working endpoints
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: assignment.lesson.module.course.id,
        },
      },
    });

    if (!enrollment || enrollment.status === "DROPPED") {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 },
      );
    }

    // Check deadline - compare dates in UTC
    const isOverdue = isDeadlinePassed(assignment.dueDate);

    if (isOverdue && !assignment.allowLateSubmission) {
      return NextResponse.json(
        { error: "Submission deadline has passed" },
        { status: 400 },
      );
    }

    // Validate file count
    if (files.length > assignment.maxFiles) {
      return NextResponse.json(
        {
          error: `Maximum ${assignment.maxFiles} file(s) allowed`,
        },
        { status: 400 },
      );
    }

    // Validate files
    for (const file of files) {
      if (file.size === 0) continue; // Skip empty files

      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

      // Check file type
      if (!assignment.allowedFileTypes.includes(fileExtension)) {
        return NextResponse.json(
          {
            error: `File type .${fileExtension} not allowed. Allowed types: ${assignment.allowedFileTypes.join(", ")}`,
          },
          { status: 400 },
        );
      }

      // Check file size
      if (file.size > assignment.maxFileSize) {
        const maxSizeMB = (assignment.maxFileSize / (1024 * 1024)).toFixed(1);
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`,
          },
          { status: 400 },
        );
      }
    }

    // Get or create submission
    let submission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId: session.user.id,
        },
      },
      include: {
        attachments: true,
      },
    });

    // Check if already submitted and graded
    if (submission && submission.status === "GRADED") {
      return NextResponse.json(
        { error: "Cannot modify a graded submission" },
        { status: 400 },
      );
    }

    // Upload files to B2
    const uploadedFiles: Array<{
      fileKey: string;
      fileId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    for (const file of files) {
      if (file.size === 0) continue;

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToB2(buffer, file.name, file.type, {
          userId: session.user.id,
          assignmentId,
          uploadedAt: new Date().toISOString(),
        });

        uploadedFiles.push({
          fileKey: result.fileKey,
          fileId: result.fileId,
          fileName: result.fileName,
          fileSize: result.contentLength,
          mimeType: file.type,
        });
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);

        // Clean up already uploaded files if one fails
        const cleanupPromises = uploadedFiles.map((uploaded) =>
          deleteFromB2(uploaded.fileKey, uploaded.fileId).catch((e) => {
            console.error(`Failed to cleanup ${uploaded.fileName}:`, e);
          }),
        );
        await Promise.all(cleanupPromises);

        // Return user-friendly error message
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to upload "${file.name}". Please try again.`;

        return NextResponse.json(
          {
            error: errorMessage,
            failedFile: file.name,
          },
          { status: 500 },
        );
      }
    }

    // Create or update submission
    if (!submission) {
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          userId: session.user.id,
          content: content || null,
          status: "SUBMITTED",
          submittedAt: new Date(),
          maxGrade: assignment.maxPoints,
          attachments: {
            create: uploadedFiles.map((file) => ({
              fileKey: file.fileKey,
              fileId: file.fileId,
              fileName: file.fileName,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
            })),
          },
        },
        include: {
          attachments: true,
        },
      });
    } else {
      submission = await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          content: content || submission.content,
          status: "SUBMITTED",
          submittedAt: new Date(),
          attachments: {
            create: uploadedFiles.map((file) => ({
              fileKey: file.fileKey,
              fileId: file.fileId,
              fileName: file.fileName,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
            })),
          },
        },
        include: {
          attachments: true,
        },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "ASSIGNMENT_SUBMITTED",
      entityType: "AssignmentSubmission",
      entityId: submission.id,
      metadata: {
        assignmentId,
        fileCount: uploadedFiles.length,
        isLate: isOverdue,
      },
    });

    return NextResponse.json(
      {
        submission,
        message: "Submission uploaded successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating submission:", error);

    // Provide specific error messages
    let errorMessage = "Failed to submit assignment. Please try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("storage") || msg.includes("quota")) {
        errorMessage =
          "Storage quota exceeded. Please contact your administrator.";
      } else if (msg.includes("network") || msg.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (msg.includes("timeout")) {
        errorMessage = "Upload timed out. Please try with smaller files.";
      } else if (msg.includes("auth")) {
        errorMessage = "Authentication error. Please try logging in again.";
        statusCode = 401;
      } else if (error.message.length < 200) {
        // Use the actual error message if it's concise
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
