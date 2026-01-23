import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

// POST /api/admin/resources - Upload resource file
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const lessonId = formData.get("lessonId") as string;
    const title = formData.get("title") as string;
    const type = (formData.get("type") as string) || "DOCUMENT";

    if (!file || !lessonId) {
      return NextResponse.json(
        { error: "File and lessonId are required" },
        { status: 400 },
      );
    }

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `resources/${Date.now()}-${file.name}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // Get the next order number
    const lastResource = await prisma.lessonResource.findFirst({
      where: { lessonId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = (lastResource?.order ?? 0) + 1;

    // Create resource record
    const resource = await prisma.lessonResource.create({
      data: {
        title: title || file.name,
        type,
        url: key,
        lessonId,
        order,
      },
    });

    return NextResponse.json(
      { resource, message: "Resource uploaded successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading resource:", error);
    return NextResponse.json(
      { error: "Failed to upload resource" },
      { status: 500 },
    );
  }
}

// GET /api/admin/resources - List resources for a lesson
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

    const resources = await prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 },
    );
  }
}
