import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists with that email, you will receive a password reset link.",
      });
    }

    // Generate reset token
    const token = nanoid(32);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    // Store token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Log the request
    await createAuditLog({
      userId: user.id,
      action: "USER_LOGIN", // We'll add PASSWORD_RESET_REQUESTED to enum later
      entityType: "User",
      entityId: user.id,
      metadata: { action: "password_reset_requested" },
      ipAddress:
        request.headers.get("x-forwarded-for") || request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, use Resend)
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
    console.log(`Password reset link for ${email}: ${resetLink}`);

    return NextResponse.json({
      message:
        "If an account exists with that email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset" },
      { status: 500 },
    );
  }
}
