import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  uploadToR2,
  getSignedUrl,
  validateFile,
  FILE_VALIDATIONS,
} from "@/lib/r2";
import { createAuditLog } from "@/lib/audit";

// POST: Upload resource to lesson
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const lessonId = formData.get("lessonId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const type = (formData.get("type") as string) || "FILE";
    const externalUrl = formData.get("externalUrl") as string | null;
    const rawEmbedCode = formData.get("embedCode") as string | null;
    const rawTextContent = formData.get("textContent") as string | null;

    // Sanitize HTML content to prevent XSS
    const embedCode = rawEmbedCode ? sanitizeHtml(rawEmbedCode) : null;
    const textContent = rawTextContent ? sanitizeHtml(rawTextContent) : null;

    const visibility = (formData.get("visibility") as string) || "PUBLIC";
    const downloadable = formData.get("downloadable") === "true";
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];

    if (!lessonId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    let fileKey: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    // Handle file upload
    if (type === "FILE" && file) {
      // Validate file size and type
      const validation = validateFile(
        file,
        FILE_VALIDATIONS.document.allowedTypes,
        FILE_VALIDATIONS.document.maxSizeMB,
      );
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadToR2(buffer, file.name, file.type);

      fileKey = uploadResult.key;
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
    }

    // Get current max order
    const maxOrder = await prisma.lessonResource.findFirst({
      where: { lessonId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = (maxOrder?.order ?? -1) + 1;

    // Create resource
    const resource = await prisma.lessonResource.create({
      data: {
        lessonId,
        title,
        description,
        type: type as "FILE" | "EXTERNAL_LINK" | "EMBEDDED" | "TEXT_NOTE",
        fileKey,
        fileName,
        fileSize,
        mimeType,
        externalUrl,
        embedCode,
        textContent,
        visibility: visibility as "PUBLIC" | "SCHEDULED" | "HIDDEN",
        downloadable,
        tags,
        order,
        version: 1,
        isLatest: true,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create initial version if file uploaded
    if (fileKey) {
      await prisma.resourceVersion.create({
        data: {
          resourceId: resource.id,
          version: 1,
          fileKey,
          fileName,
          fileSize,
          mimeType,
          uploadedBy: session.user.id,
        },
      });
    }

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "FILE_UPLOADED",
      entityType: "LessonResource",
      entityId: resource.id,
      metadata: {
        fileName: fileName || undefined,
        type,
        lessonId,
        lessonTitle: resource.lesson.title,
        visibility,
        downloadable,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 },
    );
  }
}

// GET: Get resources for a lesson
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const resources = await prisma.lessonResource.findMany({
      where: {
        lessonId,
        // Students only see PUBLIC or SCHEDULED (if past date) resources
        ...(session.user.role === "STUDENT" && {
          OR: [
            { visibility: "PUBLIC" },
            {
              visibility: "SCHEDULED",
              scheduledAt: {
                lte: new Date(),
              },
            },
          ],
        }),
      },
      orderBy: { order: "asc" },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 5, // Last 5 versions
        },
      },
    });

    // Generate signed URLs for downloadable files
    const resourcesWithUrls = await Promise.all(
      resources.map(async (resource) => {
        if (resource.fileKey && resource.downloadable) {
          const signedUrl = await getSignedUrl(resource.fileKey);
          return { ...resource, signedUrl };
        }
        return resource;
      }),
    );

    return NextResponse.json(resourcesWithUrls);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 },
    );
  }
}
