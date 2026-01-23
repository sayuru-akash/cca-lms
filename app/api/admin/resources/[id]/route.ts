import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

// DELETE /api/admin/resources/[id] - Delete resource
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

    const resource = await prisma.lessonResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // Delete from R2 if it's a file
    if (resource.url.startsWith("resources/")) {
      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: resource.url,
          }),
        );
      } catch (error) {
        console.error("Error deleting from R2:", error);
      }
    }

    // Delete from database
    await prisma.lessonResource.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/resources/[id] - Update resource
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
    const { title, url, type } = body;

    const resource = await prisma.lessonResource.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(type !== undefined && { type }),
      },
    });

    return NextResponse.json({
      resource,
      message: "Resource updated successfully",
    });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}
