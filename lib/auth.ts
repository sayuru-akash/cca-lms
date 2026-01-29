import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { auditActions } from "./audit";

/**
 * NextAuth configuration
 * NOTE: With trustHost: true, DO NOT set NEXTAUTH_URL environment variable
 * It will automatically use the request host (works with Vercel preview URLs)
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Allows auth to work on any domain (including Vercel preview URLs)
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null; // Return null instead of throwing to avoid Configuration error
          }

          // Verify Turnstile token
          if (!credentials.turnstileToken) {
            throw new Error("CAPTCHA verification required");
          }

          const turnstileResponse = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY!,
                response: credentials.turnstileToken as string,
              }),
            },
          );

          const turnstileResult = await turnstileResponse.json();

          if (!turnstileResult.success) {
            throw new Error("CAPTCHA verification failed");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) {
            return null; // Return null for invalid user
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!isPasswordValid) {
            return null; // Return null for invalid password
          }

          if (user.status !== "ACTIVE") {
            throw new Error("Account is not active"); // Keep this as an error since it's a specific account status issue
          }

          // Log the login
          await auditActions.userLogin(user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          // Only throw specific account status errors, return null for credential issues
          if (
            error instanceof Error &&
            error.message === "Account is not active"
          ) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Add custom fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "LECTURER" | "ADMIN";
      }
      return session;
    },
    async signIn({ user, account }) {
      // Check if user exists and is active
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && existingUser.status !== "ACTIVE") {
          return false;
        }

        // For OAuth users, ensure they have a role
        if (existingUser && !existingUser.role) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: "STUDENT" },
          });
        }
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Log user creation
      if (user.id) {
        await auditActions.userCreated(user.id, user.id);
      }
    },
  },
});

/**
 * Get the current session server-side
 */
export async function getSession() {
  return auth();
}

/**
 * Get the current user server-side
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require specific role - throws if user doesn't have the required role
 */
export async function requireRole(role: "STUDENT" | "LECTURER" | "ADMIN") {
  const user = await requireAuth();

  const allowedRoles: Record<string, string[]> = {
    STUDENT: ["STUDENT"],
    LECTURER: ["LECTURER", "ADMIN"],
    ADMIN: ["ADMIN"],
  };

  if (!allowedRoles[role].includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}

/**
 * Generate an invite token
 */
export async function generateInviteToken(email: string) {
  const token = nanoid(32);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days expiry

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update existing user with invite token
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        inviteToken: token,
        inviteExpires: expires,
        status: "INVITED",
      },
    });
  } else {
    // Create new user with invite token
    await prisma.user.create({
      data: {
        email,
        inviteToken: token,
        inviteExpires: expires,
        status: "INVITED",
        role: "STUDENT",
      },
    });
  }

  return token;
}

/**
 * Validate an invite token
 */
export async function validateInviteToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
  });

  if (!user || !user.inviteExpires || user.inviteExpires < new Date()) {
    return null;
  }

  return user;
}

/**
 * Accept an invite token and set password
 */
export async function acceptInviteToken(token: string, password: string) {
  const user = await validateInviteToken(token);

  if (!user) {
    throw new Error("Invalid or expired invite token");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      status: "ACTIVE",
      inviteToken: null,
      inviteExpires: null,
      emailVerified: new Date(),
    },
  });

  return user;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
