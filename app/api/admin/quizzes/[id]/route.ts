import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

// GET: Get single quiz with questions
// ADMIN: full access, LECTURER: must own course, STUDENT: must be enrolled
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                course: {
                  select: {
                    id: true,
                    lecturers: {
                      select: {
                        lecturerId: true,
                      },
                    },
                    enrollments: {
                      where: {
                        userId: session.user.id,
                        status: "ACTIVE",
                      },
                      select: {
                        userId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        questions: {
          include: {
            answers: {
              select: {
                id: true,
                answer: true,
                order: true,
                ...(session.user.role === "STUDENT" ? {} : { isCorrect: true }),
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Authorization check - ADMIN has full access
    if (session.user.role !== "ADMIN") {
      if (session.user.role === "LECTURER") {
        const isAssigned = quiz.lesson.module.course.lecturers.some(
          (l) => l.lecturerId === session.user.id,
        );
        if (!isAssigned) {
          return NextResponse.json(
            { error: "Not authorized for this course" },
            { status: 403 },
          );
        }
      } else if (session.user.role === "STUDENT") {
        const isEnrolled = quiz.lesson.module.course.enrollments.length > 0;
        if (!isEnrolled) {
          return NextResponse.json(
            {
              error: "You must be enrolled in this course to access this quiz",
            },
            { status: 403 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "Invalid user role" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 },
    );
  }
}

// PUT: Update quiz
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showResults,
      questions,
    } = body;

    // Update quiz metadata
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (passingScore !== undefined) updateData.passingScore = passingScore;
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts;
    if (shuffleQuestions !== undefined)
      updateData.shuffleQuestions = shuffleQuestions;
    if (shuffleAnswers !== undefined)
      updateData.shuffleAnswers = shuffleAnswers;
    if (showResults !== undefined) updateData.showResults = showResults;

    // If questions are provided, replace all questions
    if (questions) {
      // Delete existing questions (cascade will delete answers)
      await prisma.quizQuestion.deleteMany({
        where: { quizId: id },
      });

      // Create new questions
      updateData.questions = {
        create: questions.map((q: any, index: number) => ({
          type: q.type,
          question: q.question,
          explanation: q.explanation,
          points: q.points || 1,
          order: index,
          answers: {
            create: q.answers.map((a: any, aIndex: number) => ({
              answer: a.answer,
              isCorrect: a.isCorrect || false,
              order: aIndex,
            })),
          },
        })),
      };
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          include: {
            answers: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "LESSON_UPDATED",
      entityType: "Quiz",
      entityId: id,
      metadata: {
        fieldsUpdated: Object.keys(updateData),
        questionsUpdated: questions !== undefined,
        newQuestionCount: questions?.length || undefined,
      },
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 },
    );
  }
}

// DELETE: Delete quiz
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get quiz info before deletion
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    await prisma.quiz.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "LESSON_DELETED",
      entityType: "Quiz",
      entityId: id,
      metadata: {
        title: quiz.title,
        lessonId: quiz.lessonId,
        questionCount: quiz.questions.length,
      },
    });

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 },
    );
  }
}
