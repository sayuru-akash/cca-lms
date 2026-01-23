import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/admin/quiz-questions - Create quiz question
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      lessonId,
      question,
      type,
      options,
      correctAnswer,
      points,
      explanation,
    } = body;

    if (!lessonId || !question || !type) {
      return NextResponse.json(
        { error: "lessonId, question, and type are required" },
        { status: 400 },
      );
    }

    // Get the next order number
    const lastQuestion = await prisma.quizQuestion.findFirst({
      where: { lessonId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = (lastQuestion?.order ?? 0) + 1;

    const quizQuestion = await prisma.quizQuestion.create({
      data: {
        lessonId,
        question,
        type,
        options: options || [],
        correctAnswer: correctAnswer || "",
        points: points || 1,
        explanation: explanation || null,
        order,
      },
    });

    return NextResponse.json(
      { question: quizQuestion, message: "Question created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating quiz question:", error);
    return NextResponse.json(
      { error: "Failed to create quiz question" },
      { status: 500 },
    );
  }
}

// GET /api/admin/quiz-questions - List questions for a lesson
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 },
      );
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz questions" },
      { status: 500 },
    );
  }
}
