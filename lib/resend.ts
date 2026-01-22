import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable.');
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!;
const APP_NAME = process.env.APP_NAME || 'Codezela Career Accelerator - LMS';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Send a password reset email
 * @param to - Recipient email address
 * @param token - Password reset token
 */
export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Reset Your Password - ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
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
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
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
 * Send an account invitation email
 * @param to - Recipient email address
 * @param inviteToken - Unique invitation token
 * @param inviterName - Name of the person who sent the invite
 */
export async function sendAccountInviteEmail(
  to: string,
  inviteToken: string,
  inviterName?: string
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
            ${inviterName ? `<p>${inviterName} has invited you to join our learning platform.</p>` : ''}
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
  message: string
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
