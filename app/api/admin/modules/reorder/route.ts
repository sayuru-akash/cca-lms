import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/admin/modules/reorder - Reorder modules
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { modules } = body; // Array of { id, order }

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: "Invalid modules array" },
        { status: 400 },
      );
    }

    // Update all module orders in a transaction
    await prisma.$transaction(
      modules.map((module) =>
        prisma.module.update({
          where: { id: module.id },
          data: { order: module.order },
        }),
      ),
    );

    return NextResponse.json({
      message: "Modules reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering modules:", error);
    return NextResponse.json(
      { error: "Failed to reorder modules" },
      { status: 500 },
    );
  }
}
