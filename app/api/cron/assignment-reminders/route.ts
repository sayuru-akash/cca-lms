import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAssignmentDueSoonReminders } from "@/lib/resend";

// POST /api/cron/assignment-reminders - Send due soon reminders
// Called by Vercel Cron daily at 9 AM
export async function POST(request: NextRequest) {
  try {
    // Verify this is called from Vercel Cron (check user-agent for Vercel)
    const userAgent = request.headers.get("user-agent") || "";
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow Vercel Cron or manual calls with proper auth
    const isVercelCron = userAgent.includes("vercel");
    const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find assignments due within 24 hours that haven't been submitted
    const now = new Date();
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );

    const assignmentsDueSoon = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: twentyFourHoursFromNow,
        },
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  include: {
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
        assignmentSubmissions: {
          select: {
            userId: true,
            status: true,
          },
        },
      },
    });

    // Process each assignment concurrently
    const reminderResults = await Promise.all(
      assignmentsDueSoon.map(async (assignment) => {
        const enrolledStudents = assignment.lesson.module.course.enrollments;
        const submittedUserIds = new Set(
          assignment.assignmentSubmissions
            .filter(
              (sub) => sub.status === "SUBMITTED" || sub.status === "GRADED",
            )
            .map((sub) => sub.userId),
        );

        // Find students who haven't submitted yet
        const studentsWithoutSubmission = enrolledStudents
          .filter((enrollment) => !submittedUserIds.has(enrollment.user.id))
          .map((enrollment) => ({
            name: enrollment.user.name || enrollment.user.email,
            email: enrollment.user.email,
            id: enrollment.user.id,
          }));

        if (studentsWithoutSubmission.length > 0) {
          try {
            await sendAssignmentDueSoonReminders(
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
              studentsWithoutSubmission,
            );

            return studentsWithoutSubmission.length;
          } catch (error) {
            console.error(
              `Failed to send reminders for assignment ${assignment.id}:`,
              error,
            );
            return 0;
          }
        }
        return 0;
      }),
    );

    const totalRemindersSent = reminderResults.reduce(
      (acc, count) => acc + count,
      0,
    );

    return NextResponse.json({
      success: true,
      assignmentsProcessed: assignmentsDueSoon.length,
      remindersSent: totalRemindersSent,
      message: `Processed ${assignmentsDueSoon.length} assignments due soon, sent ${totalRemindersSent} reminder emails`,
    });
  } catch (error) {
    console.error("Error in assignment reminder cron job:", error);
    return NextResponse.json(
      { error: "Failed to send assignment reminders" },
      { status: 500 },
    );
  }
}

// GET /api/cron/assignment-reminders - Get upcoming assignments info (for monitoring)
export async function GET() {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );

    const assignmentsDueSoon = await prisma.assignment.count({
      where: {
        dueDate: {
          gte: now,
          lte: twentyFourHoursFromNow,
        },
      },
    });

    const totalActiveAssignments = await prisma.assignment.count({
      where: {
        dueDate: {
          gte: now,
        },
      },
    });

    return NextResponse.json({
      assignmentsDueSoon,
      totalActiveAssignments,
      checkTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Error checking assignment reminders:", error);
    return NextResponse.json(
      { error: "Failed to check assignments" },
      { status: 500 },
    );
  }
}
