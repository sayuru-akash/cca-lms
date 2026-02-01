import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAssignmentCreatedEmails } from "@/lib/resend";
import { createAuditLog } from "@/lib/audit";

// POST /api/admin/assignments - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      lessonId,
      title,
      description,
      instructions,
      dueDate,
      maxPoints,
      allowedFileTypes,
      maxFileSize,
      maxFiles,
      allowLateSubmission,
    } = body;

    if (!lessonId || !title || !dueDate) {
      return NextResponse.json(
        { error: "Lesson ID, title, and due date are required" },
        { status: 400 },
      );
    }

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
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
      });

      if (!lesson || lesson.module.course.lecturers.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Validate due date is in the future
    const dueDateParsed = new Date(dueDate);
    const now = new Date();

    if (dueDateParsed < now) {
      return NextResponse.json(
        { error: "Due date must be in the future" },
        { status: 400 },
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        lessonId,
        title,
        description: description || null,
        instructions: instructions || null,
        dueDate: dueDateParsed,
        maxPoints: maxPoints || 100,
        allowedFileTypes: allowedFileTypes || [
          "pdf",
          "docx",
          "doc",
          "txt",
          "zip",
        ],
        maxFileSize: maxFileSize || 10485760, // 10MB default
        maxFiles: maxFiles || 5,
        allowLateSubmission: allowLateSubmission || false,
      },
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
                    enrollments: {
                      where: {
                        status: "ACTIVE",
                      },
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
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
        _count: {
          select: {
            assignmentSubmissions: true,
          },
        },
      },
    });

    // Send email notifications to enrolled students (async, don't block response)
    if (assignment.lesson.module.course.enrollments.length > 0) {
      const enrolledStudents = assignment.lesson.module.course.enrollments.map(
        (enrollment) => ({
          name: enrollment.user.name || enrollment.user.email,
          email: enrollment.user.email,
          id: enrollment.user.id,
        }),
      );

      // Send emails asynchronously
      setImmediate(async () => {
        try {
          await sendAssignmentCreatedEmails(
            {
              studentName: "", // Not used for bulk emails
              studentEmail: "", // Not used for bulk emails
              assignmentTitle: assignment.title,
              courseTitle: assignment.lesson.module.course.title,
              dueDate: assignment.dueDate,
              assignmentId: assignment.id,
              courseId: assignment.lesson.module.course.id,
              lessonId: assignment.lesson.id,
            },
            enrolledStudents,
          );
        } catch (error) {
          console.error("Failed to send assignment creation emails:", error);
        }
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "ASSIGNMENT_CREATED",
      entityType: "Assignment",
      entityId: assignment.id,
      metadata: {
        title,
        lessonId,
        dueDate: dueDate,
      },
    });

    return NextResponse.json(
      { assignment, message: "Assignment created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 },
    );
  }
}

// GET /api/admin/assignments - List assignments
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");
    const courseId = searchParams.get("courseId");

    // Build where clause dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (lessonId) {
      whereClause.lessonId = lessonId;
    }

    if (courseId) {
      whereClause.lesson = {
        module: {
          courseId: courseId,
        },
      };
    }

    // Lecturers can only see assignments for their courses
    if (session.user.role === "LECTURER") {
      whereClause.lesson = {
        ...whereClause.lesson,
        module: {
          ...whereClause.lesson?.module,
          course: {
            lecturers: {
              some: {
                lecturerId: session.user.id,
              },
            },
          },
        },
      };
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
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
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            assignmentSubmissions: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}
