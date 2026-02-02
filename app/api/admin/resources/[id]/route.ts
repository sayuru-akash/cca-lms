import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  uploadToR2,
  getSignedUrl,
  deleteFromR2,
  validateFile,
  FILE_VALIDATIONS,
} from "@/lib/r2";
import { createAuditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

// GET: Get single resource with versions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const resource = await prisma.lessonResource.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // Generate signed URL if downloadable
    if (resource.fileKey && resource.downloadable) {
      const signedUrl = await getSignedUrl(resource.fileKey);
      return NextResponse.json({ ...resource, signedUrl });
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 },
    );
  }
}

// PUT: Update resource or upload new version
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if resource exists
    const existing = await prisma.lessonResource.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const type = formData.get("type") as string | null;
    const externalUrl = formData.get("externalUrl") as string | null;
    const rawEmbedCode = formData.get("embedCode") as string | null;
    const rawTextContent = formData.get("textContent") as string | null;

    // Sanitize HTML content to prevent XSS
    const embedCode = rawEmbedCode ? sanitizeHtml(rawEmbedCode) : null;
    const textContent = rawTextContent ? sanitizeHtml(rawTextContent) : null;

    const visibility = formData.get("visibility") as string | null;
    const downloadable = formData.get("downloadable");
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : null;
    const createNewVersion = formData.get("createNewVersion") === "true";

    const updateData: any = {};

    if (title !== null) updateData.title = title;
    if (description !== null) updateData.description = description;
    if (type !== null) updateData.type = type;
    if (externalUrl !== null) updateData.externalUrl = externalUrl;
    if (embedCode !== null) updateData.embedCode = embedCode;
    if (textContent !== null) updateData.textContent = textContent;
    if (visibility !== null) updateData.visibility = visibility;
    if (downloadable !== null)
      updateData.downloadable = downloadable === "true";
    if (tags !== null) updateData.tags = tags;

    // Handle file upload for new version
    if (file && createNewVersion) {
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

      updateData.fileKey = uploadResult.key;
      updateData.fileName = file.name;
      updateData.fileSize = file.size;
      updateData.mimeType = file.type;
      updateData.version = existing.version + 1;

      // Create version record
      await prisma.resourceVersion.create({
        data: {
          resourceId: id,
          version: existing.version + 1,
          fileKey: uploadResult.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: session.user.id,
        },
      });
    }

    // Update resource
    const updated = await prisma.lessonResource.update({
      where: { id },
      data: updateData,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 5,
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "LESSON_UPDATED",
      entityType: "LessonResource",
      entityId: id,
      metadata: {
        previousVersion: existing.version,
        newVersion: updated.version,
        createNewVersion: createNewVersion || false,
        fieldsUpdated: Object.keys(updateData),
        fileName: file?.name || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}

// DELETE: Delete resource and all versions
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get resource with all versions and course assignment info
    const resource = await prisma.lessonResource.findUnique({
      where: { id },
      include: {
        versions: true,
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    lecturers: {
                      select: {
                        lecturerId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      const isAssigned = resource.lesson.module.course.lecturers.some(
        (l) => l.lecturerId === session.user.id,
      );
      if (!isAssigned) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Delete all files from R2
    const filesToDelete = [
      resource.fileKey,
      ...resource.versions.map((v) => v.fileKey),
    ].filter((key): key is string => key !== null);

    await Promise.all(filesToDelete.map((key) => deleteFromR2(key)));

    // Delete from database (cascade will handle versions)
    await prisma.lessonResource.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "FILE_DELETED",
      entityType: "LessonResource",
      entityId: id,
      metadata: {
        fileName: resource.fileName,
        type: resource.type,
        title: resource.title,
        lessonId: resource.lessonId,
        versionsDeleted: resource.versions.length,
      },
    });

    return NextResponse.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 },
    );
  }
}
