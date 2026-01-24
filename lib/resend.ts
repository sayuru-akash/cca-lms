import { Resend } from "resend";
import { createAuditLog } from "./audit";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@codezela.com";
const APP_NAME = "Codezela Career Accelerator - LMS";
const APP_URL =
  process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
const SUPPORT_EMAIL = "support@codezela.com";

// Terminal-themed CSS styles
const getEmailStyles = () => `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', monospace; 
      line-height: 1.6; 
      color: #16a34a; 
      background-color: #000000;
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
      background-color: #000000;
    }
    .header {
      background-color: #111111;
      border: 1px solid #16a34a;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .header h1 {
      color: #16a34a;
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .header .subtitle {
      color: #10b981;
      font-size: 14px;
      opacity: 0.8;
    }
    .content {
      background-color: #111111;
      border: 1px solid #16a34a;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .prompt {
      color: #16a34a;
      font-weight: bold;
      margin-right: 8px;
    }
    .command {
      color: #10b981;
      background-color: #1a1a1a;
      padding: 8px 12px;
      border-left: 3px solid #16a34a;
      margin: 12px 0;
      border-radius: 0 4px 4px 0;
    }
    .credentials {
      background-color: #1a1a1a;
      border: 1px solid #16a34a;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .credentials .label {
      color: #16a34a;
      font-weight: bold;
      display: inline-block;
      width: 100px;
    }
    .credentials .value {
      color: #10b981;
      font-weight: bold;
    }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: #16a34a; 
      color: #000000; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 16px 0; 
      font-weight: bold;
      border: 1px solid #10b981;
      transition: all 0.3s ease;
    }
    .button:hover { 
      background-color: #10b981; 
      color: #000000;
    }
    .warning {
      background-color: #1a1a0d;
      border: 1px solid #eab308;
      color: #facc15;
      padding: 12px;
      border-radius: 4px;
      margin: 12px 0;
    }
    .danger {
      background-color: #1a0d0d;
      border: 1px solid #dc2626;
      color: #ef4444;
      padding: 12px;
      border-radius: 4px;
      margin: 12px 0;
    }
    .footer { 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 1px solid #16a34a; 
      font-size: 12px; 
      color: #10b981; 
      opacity: 0.7;
      text-align: center;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
    .link {
      color: #10b981;
      text-decoration: underline;
      word-break: break-all;
    }
    .code {
      font-family: inherit;
      background-color: #1a1a1a;
      color: #16a34a;
      padding: 2px 6px;
      border-radius: 2px;
      border: 1px solid #333;
    }
    .ascii-art {
      color: #16a34a;
      font-size: 10px;
      line-height: 1.2;
      text-align: center;
      margin: 20px 0;
      white-space: pre;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 8px;
      color: #10b981;
    }
    p {
      margin-bottom: 15px;
      color: #16a34a;
    }
    strong {
      color: #10b981;
      font-weight: bold;
    }
    @media (max-width: 600px) {
      .container { padding: 10px; }
      .header, .content { padding: 15px; }
      .button { display: block; text-align: center; margin: 15px 0; }
    }
  </style>
`;

// ASCII art for emails
const getCodezelaAscii = () => `
  ╔═══════════════════════════════════════╗
  ║   ╔═╗╔═╗╔╦╗╔═╗╔═╗╔═╗╦  ╔═╗           ║
  ║   ║  ║ ║ ║║║╣ ╔═╝║╣ ║  ╠═╣           ║
  ║   ╚═╝╚═╝═╩╝╚═╝╚═╝╚═╝╩═╝╩ ╩           ║
  ║                                       ║
  ║   Career Accelerator Learning Hub     ║
  ╚═══════════════════════════════════════╝
`;

/**
 * Email logging utility
 */
async function logEmailSent(
  to: string,
  subject: string,
  type: string,
  success: boolean,
  error?: string,
  userId?: string,
) {
  try {
    await createAuditLog({
      action: success ? "EMAIL_SENT" : "EMAIL_FAILED",
      userId: userId || "system",
      entityType: "EMAIL",
      entityId: to,
      metadata: {
        to,
        subject,
        type,
        success,
        error: error || undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (logError) {
    console.error("Failed to log email event:", logError);
  }
}

/**
 * Send email with error handling and logging
 */
async function sendEmailSafely(
  emailData: {
    from: string;
    to: string;
    subject: string;
    html: string;
  },
  emailType: string,
  userId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    await resend.emails.send(emailData);

    await logEmailSent(
      emailData.to,
      emailData.subject,
      emailType,
      true,
      undefined,
      userId,
    );
    console.log(`✅ Email sent successfully: ${emailType} to ${emailData.to}`);

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await logEmailSent(
      emailData.to,
      emailData.subject,
      emailType,
      false,
      errorMessage,
      userId,
    );
    console.error(`❌ Email failed: ${emailType} to ${emailData.to}`, error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Send account creation email with login credentials
 */
export async function sendUserCreatedEmail(
  to: string,
  userData: {
    name: string;
    email: string;
    role: "ADMIN" | "LECTURER" | "STUDENT";
    password: string;
    createdBy: string;
  },
  userId?: string,
): Promise<{ success: boolean; error?: string }> {
  const loginUrl = `${APP_URL}/auth/login`;
  const dashboardUrl = `${APP_URL}/dashboard`;

  const roleDescriptions = {
    ADMIN: "Administrator - Full system access and user management",
    LECTURER: "Lecturer - Create and manage courses, quizzes, and students",
    STUDENT: "Student - Access assigned courses and complete assessments",
  };

  const roleWelcomes = {
    ADMIN:
      "You have been granted administrator access to manage the entire learning platform.",
    LECTURER:
      "You can now create courses, manage students, and track their progress.",
    STUDENT:
      "You can access your assigned courses and start learning immediately.",
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${APP_NAME}</title>
        ${getEmailStyles()}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><span class="prompt">$</span> Account Created Successfully</h1>
            <div class="subtitle">Welcome to ${APP_NAME}</div>
          </div>
          
          <div class="ascii-art">${getCodezelaAscii()}</div>
          
          <div class="content">
            <p><span class="prompt">$</span> Hello <strong>${userData.name}</strong>,</p>
            
            <p>Your account has been created by <strong>${userData.createdBy}</strong>. ${roleWelcomes[userData.role]}</p>
            
            <div class="command">
              <span class="prompt">$</span> Account Details:
            </div>
            
            <div class="credentials">
              <div><span class="label">Email:</span> <span class="value">${userData.email}</span></div>
              <div><span class="label">Role:</span> <span class="value">${userData.role}</span></div>
              <div><span class="label">Password:</span> <span class="value">${userData.password}</span></div>
            </div>
            
            <div class="warning">
              <strong>🔐 Important Security Information:</strong><br>
              • Please log in immediately and change your password<br>
              • Store your credentials securely<br>
              • Never share your login details with others
            </div>
            
            <div class="command">
              <span class="prompt">$</span> Role Permissions: ${roleDescriptions[userData.role]}
            </div>
            
            <p><strong>Quick Start Guide:</strong></p>
            <ul>
              <li>Click the login button below or visit: <span class="code">${loginUrl}</span></li>
              <li>Use your email and the provided password to sign in</li>
              <li>Update your password in Settings for security</li>
              <li>Complete your profile information</li>
              ${userData.role === "STUDENT" ? '<li>Check your assigned courses in "My Programmes"</li>' : ""}
              ${userData.role === "LECTURER" ? '<li>Start creating your first course in "Programmes"</li>' : ""}
              ${userData.role === "ADMIN" ? "<li>Explore the admin dashboard and user management</li>" : ""}
            </ul>
            
            <a href="${loginUrl}" class="button">
              <span class="prompt">$</span> LOGIN TO PLATFORM
            </a>
            
            <p>Direct login link: <a href="${loginUrl}" class="link">${loginUrl}</a></p>
            <p>Dashboard: <a href="${dashboardUrl}" class="link">${dashboardUrl}</a></p>
            
            <div class="danger">
              <strong>⚠️ Security Notice:</strong> This email contains sensitive login information. Please delete this email after saving your credentials securely.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>${APP_NAME}</strong></p>
            <p>Developed with ❤️ by <a href="https://codezela.com">Codezela Technologies</a></p>
            <p>Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmailSafely(
    {
      from: FROM_EMAIL,
      to,
      subject: `🚀 Welcome to ${APP_NAME} - Your Account is Ready!`,
      html,
    },
    "USER_CREATED",
    userId,
  );
}

/**
 * Send password reset email with terminal theme
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  userName?: string,
  userId?: string,
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - ${APP_NAME}</title>
        ${getEmailStyles()}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><span class="prompt">$</span> Password Reset Request</h1>
            <div class="subtitle">Security Protocol Initiated</div>
          </div>
          
          <div class="ascii-art">${getCodezelaAscii()}</div>
          
          <div class="content">
            <p><span class="prompt">$</span> Hello ${userName ? `<strong>${userName}</strong>` : "User"},</p>
            
            <p>We received a request to reset your password for your ${APP_NAME} account.</p>
            
            <div class="command">
              <span class="prompt">$</span> Password Reset Instructions:
            </div>
            
            <ul>
              <li>Click the reset button below to create a new password</li>
              <li>You will be redirected to a secure password reset page</li>
              <li>Enter your new password (minimum 8 characters)</li>
              <li>Confirm your new password</li>
              <li>Log in with your new credentials</li>
            </ul>
            
            <a href="${resetUrl}" class="button">
              <span class="prompt">$</span> RESET PASSWORD
            </a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p><span class="code">${resetUrl}</span></p>
            
            <div class="warning">
              <strong>⏰ Time Sensitive:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons.
            </div>
            
            <div class="danger">
              <strong>🔒 Security Alert:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>${APP_NAME}</strong></p>
            <p>Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmailSafely(
    {
      from: FROM_EMAIL,
      to,
      subject: `🔐 Password Reset - ${APP_NAME}`,
      html,
    },
    "PASSWORD_RESET",
    userId,
  );
}

/**
 * Send an account invitation email
 * @param to - Recipient email address
 * @param inviteToken - Unique invitation token
 * @param inviterName - Name of the person who sent the invite
 */
export async function sendAccountInviteEmail(
  to: string,
  inviteToken: string,
  inviterName?: string,
) {
  const inviteUrl = `${APP_URL}/auth/accept-invite?token=${inviteToken}`;

  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You're Invited to Join ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're Invited!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0; }
            .button:hover { background-color: #218838; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You're Invited to Join ${APP_NAME}</h2>
            ${inviterName ? `<p>${inviterName} has invited you to join our learning platform.</p>` : ""}
            <p>Click the button below to accept the invitation and set up your account:</p>
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${inviteUrl}</p>
            <p><strong>This invitation will expire in 7 days.</strong></p>
            <div class="footer">
              <p>${APP_NAME}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send an email verification email
 * @param to - Recipient email address
 * @param token - Verification token
 */
export async function sendEmailVerification(to: string, token: string) {
  const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`;

  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Verify Your Email - ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0; }
            .button:hover { background-color: #0056b3; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Verify Your Email Address</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verifyUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verifyUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <div class="footer">
              <p>${APP_NAME}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send a notification email
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param message - Email content (HTML)
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string,
) {
  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${subject} - ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            ${message}
            <div class="footer">
              <p>${APP_NAME}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
