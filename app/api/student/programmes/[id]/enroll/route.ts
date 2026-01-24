import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = params.id;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Programme not found" },
        { status: 404 },
      );
    }

    // Check if already enrolled
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        status: "ACTIVE",
        progress: 0,
      },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error("Error enrolling in programme:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
