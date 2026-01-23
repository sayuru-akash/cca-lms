import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Reorder resources
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Invalid updates format" },
        { status: 400 },
      );
    }

    // Update all resource orders in a transaction
    await prisma.$transaction(
      updates.map((update: { id: string; order: number }) =>
        prisma.lessonResource.update({
          where: { id: update.id },
          data: { order: update.order },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering resources:", error);
    return NextResponse.json(
      { error: "Failed to reorder resources" },
      { status: 500 },
    );
  }
}
