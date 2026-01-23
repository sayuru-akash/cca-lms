import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST: Create quiz for a lesson
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      lessonId,
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showResults,
      questions, // Array of { question, type, explanation, points, answers: [{answer, isCorrect}] }
    } = body;

    if (!lessonId || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify lesson exists and doesn't have a quiz yet
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { quiz: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.quiz) {
      return NextResponse.json(
        { error: "Lesson already has a quiz" },
        { status: 400 },
      );
    }

    // Create quiz with questions and answers
    const quiz = await prisma.quiz.create({
      data: {
        lessonId,
        title,
        description,
        timeLimit,
        passingScore: passingScore || 70,
        maxAttempts,
        shuffleQuestions: shuffleQuestions || false,
        shuffleAnswers: shuffleAnswers || false,
        showResults: showResults !== false,
        questions: {
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
        },
      },
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

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 },
    );
  }
}

// GET: Get quiz for a lesson
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          include: {
            answers: {
              // Hide correct answers from students
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

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 },
    );
  }
}
