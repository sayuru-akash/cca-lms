import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/admin/quiz-questions/[id] - Get single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const question = await prisma.quizQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/quiz-questions/[id] - Update question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { question, type, options, correctAnswer, points, explanation } =
      body;

    const updatedQuestion = await prisma.quizQuestion.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(type !== undefined && { type }),
        ...(options !== undefined && { options }),
        ...(correctAnswer !== undefined && { correctAnswer }),
        ...(points !== undefined && { points }),
        ...(explanation !== undefined && { explanation }),
      },
    });

    return NextResponse.json({
      question: updatedQuestion,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/quiz-questions/[id] - Delete question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const question = await prisma.quizQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    await prisma.quizQuestion.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}
