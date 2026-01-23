import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST: Start or submit quiz attempt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, action, responses } = body;

    if (!quizId) {
      return NextResponse.json({ error: "Missing quizId" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // START new attempt
    if (action === "start") {
      // Check max attempts
      if (quiz.maxAttempts) {
        const existingAttempts = await prisma.quizAttempt.count({
          where: {
            quizId,
            userId: session.user.id,
            status: "SUBMITTED",
          },
        });

        if (existingAttempts >= quiz.maxAttempts) {
          return NextResponse.json(
            { error: "Maximum attempts reached" },
            { status: 400 },
          );
        }
      }

      // Get next attempt number
      const lastAttempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId,
          userId: session.user.id,
        },
        orderBy: { attemptNumber: "desc" },
      });

      const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1;

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId,
          userId: session.user.id,
          attemptNumber,
          status: "IN_PROGRESS",
        },
      });

      return NextResponse.json(attempt, { status: 201 });
    }

    // SUBMIT attempt
    if (action === "submit") {
      const { attemptId } = body;

      if (!attemptId || !responses) {
        return NextResponse.json(
          { error: "Missing attemptId or responses" },
          { status: 400 },
        );
      }

      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
      });

      if (!attempt || attempt.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Attempt not found" },
          { status: 404 },
        );
      }

      if (attempt.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Attempt already submitted" },
          { status: 400 },
        );
      }

      // Grade responses
      let totalScore = 0;
      let maxScore = 0;

      const gradedResponses = await Promise.all(
        responses.map(async (response: any) => {
          const question = quiz.questions.find(
            (q) => q.id === response.questionId,
          );

          if (!question) return null;

          maxScore += question.points;
          let isCorrect = false;
          let points = 0;

          if (
            question.type === "MULTIPLE_CHOICE" ||
            question.type === "TRUE_FALSE"
          ) {
            const correctAnswer = question.answers.find((a) => a.isCorrect);
            isCorrect = correctAnswer?.id === response.answerId;
            points = isCorrect ? question.points : 0;
          } else {
            // SHORT_ANSWER or LONG_ANSWER - manual grading required
            isCorrect = null;
            points = null;
          }

          totalScore += points || 0;

          return prisma.quizResponse.create({
            data: {
              attemptId,
              questionId: response.questionId,
              answer: response.answer || response.answerId,
              isCorrect: isCorrect !== null ? isCorrect : null,
              points,
            },
          });
        }),
      );

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // Update attempt
      const submittedAttempt = await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: "SUBMITTED",
          score: totalScore,
          maxScore,
          percentage,
          submittedAt: new Date(),
          gradedAt: new Date(), // Auto-graded
        },
        include: {
          responses: {
            include: {
              question: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json(submittedAttempt);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error handling quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to handle quiz attempt" },
      { status: 500 },
    );
  }
}

// GET: Get user's attempts for a quiz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json({ error: "Missing quizId" }, { status: 400 });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        userId: session.user.id,
      },
      include: {
        responses: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { attemptNumber: "desc" },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("Error fetching attempts:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 },
    );
  }
}
