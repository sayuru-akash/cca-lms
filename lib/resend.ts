import { Resend } from "resend";
import { createAuditLog, createAuditLogs } from "./audit";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("⚠️ RESEND_API_KEY environment variable is missing");
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }
  return new Resend(apiKey);
}

// Enhanced error handling with retry logic
const sendEmailWithRetry = async (
  emailData: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
  },
  maxRetries = 3,
) => {
  const resend = getResendClient();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send(emailData);
      return result;
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        // Log final failure
        await createAuditLog({
          action: "EMAIL_FAILED",
          entityType: "SYSTEM",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
            recipientEmail: Array.isArray(emailData.to)
              ? emailData.to.join(", ")
              : emailData.to,
            subject: emailData.subject,
            attempts: maxRetries,
          },
        });
        throw error;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@codezela.com";
const APP_NAME = "Codezela Career Accelerator - LMS";
const APP_URL = process.env.APP_URL || "https://lms.cca.it.com"; // Default to production URL
const SUPPORT_EMAIL = "ca@codezela.com";

// Assignment Email Templates
interface AssignmentEmailData {
  studentName: string;
  studentEmail: string;
  assignmentTitle: string;
  courseTitle: string;
  dueDate: Date;
  assignmentId: string;
  courseId: string;
  lessonId: string;
}

interface GradingEmailData {
  studentName: string;
  studentEmail: string;
  assignmentTitle: string;
  courseTitle: string;
  grade: number;
  maxPoints: number;
  feedback?: string;
  assignmentId: string;
}

// Send assignment created notification to enrolled students
export async function sendAssignmentCreatedEmails(
  assignmentData: AssignmentEmailData,
  enrolledStudents: Array<{ name: string; email: string; id: string }>,
) {
  const emailPromises = enrolledStudents.map(async (student) => {
    const dueText = assignmentData.dueDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const dueDays = Math.ceil(
      (assignmentData.dueDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const dueSoon = dueDays <= 1 ? "Due soon!" : `Due in ${dueDays} days`;

    const html = `
      ${getEmailStyles()}
      <div class="container">
        <div class="header">
          <h1>📝 New Assignment Available</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${student.name}</strong>,</p>
          
          <p>A new assignment has been posted in your course:</p>
          
          <div class="highlight-box">
            <strong>📚 Course:</strong> ${assignmentData.courseTitle}<br>
            <strong>📋 Assignment:</strong> ${assignmentData.assignmentTitle}<br>
            <strong>⏰ Due:</strong> ${dueText}<br>
            <strong>⚡ Status:</strong> <span class="urgent">${dueSoon}</span>
          </div>
          
          <p>Click the button below to view the assignment details and submit your work:</p>
          
          <div class="cta-section">
            <a href="${APP_URL}/learn/assignment/${assignmentData.assignmentId}" class="cta-button">
              💻 View Assignment
            </a>
          </div>
          
          <p>You can also access it through your course page:</p>
          <p><a href="${APP_URL}/learn/${assignmentData.courseId}/lesson/${assignmentData.lessonId}" class="link">
            Go to Lesson →
          </a></p>
        </div>
        
        <div class="footer">
          <p>Happy coding! 🚀</p>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
          <p class="support-text">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" class="link">${SUPPORT_EMAIL}</a></p>
        </div>
      </div>
    `;

    try {
      await sendEmailWithRetry({
        from: FROM_EMAIL,
        to: student.email,
        subject: `📝 New Assignment: ${assignmentData.assignmentTitle} - ${dueSoon}`,
        html,
      });

      await createAuditLog({
        action: "EMAIL_SENT",
        userId: student.id,
        entityType: "ASSIGNMENT",
        entityId: assignmentData.assignmentId,
        metadata: {
          type: "assignment_created",
          recipientEmail: student.email,
          assignmentTitle: assignmentData.assignmentTitle,
          courseTitle: assignmentData.courseTitle,
        },
      });
    } catch (error) {
      console.error(
        `Failed to send assignment notification to ${student.email}:`,
        error,
      );
      // Don't throw - continue with other emails
    }
  });

  await Promise.allSettled(emailPromises);
}

// Send assignment graded notification to student
export async function sendAssignmentGradedEmail(gradingData: GradingEmailData) {
  const percentage = Math.round(
    (gradingData.grade / gradingData.maxPoints) * 100,
  );
  const gradeStatus =
    percentage >= 90
      ? "🌟 Excellent!"
      : percentage >= 80
        ? "✅ Great work!"
        : percentage >= 70
          ? "👍 Good job!"
          : percentage >= 60
            ? "📈 Keep improving!"
            : "💪 Keep working hard!";

  const html = `
    ${getEmailStyles()}
    <div class="container">
      <div class="header">
        <h1>📊 Assignment Graded</h1>
      </div>
      
      <div class="content">
        <p>Hello <strong>${gradingData.studentName}</strong>,</p>
        
        <p>Your assignment has been graded! Here are the results:</p>
        
        <div class="highlight-box">
          <strong>📚 Course:</strong> ${gradingData.courseTitle}<br>
          <strong>📋 Assignment:</strong> ${gradingData.assignmentTitle}<br>
          <strong>🎯 Your Score:</strong> <span class="grade-score">${gradingData.grade}/${gradingData.maxPoints} (${percentage}%)</span><br>
          <strong>🏆 Status:</strong> <span class="${percentage >= 70 ? "success" : "needs-improvement"}">${gradeStatus}</span>
        </div>
        
        ${
          gradingData.feedback
            ? `
        <div class="feedback-section">
          <h3>💬 Instructor Feedback:</h3>
          <div class="feedback-content">
            ${gradingData.feedback.replace(/\n/g, "<br>")}
          </div>
        </div>
        `
            : ""
        }
        
        <div class="cta-section">
          <a href="${APP_URL}/learn/assignment/${gradingData.assignmentId}" class="cta-button">
            📄 View Full Results
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>Keep up the excellent work! 🚀</p>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
        <p class="support-text">Questions about your grade? Contact your instructor or reach out to <a href="mailto:${SUPPORT_EMAIL}" class="link">${SUPPORT_EMAIL}</a></p>
      </div>
    </div>
  `;

  try {
    await sendEmailWithRetry({
      from: FROM_EMAIL,
      to: gradingData.studentEmail,
      subject: `🎯 Assignment Graded: ${gradingData.assignmentTitle} - ${percentage}% (${gradeStatus})`,
      html,
    });

    await createAuditLog({
      action: "EMAIL_SENT",
      entityType: "ASSIGNMENT",
      entityId: gradingData.assignmentId,
      metadata: {
        type: "assignment_graded",
        recipientEmail: gradingData.studentEmail,
        assignmentTitle: gradingData.assignmentTitle,
        courseTitle: gradingData.courseTitle,
        grade: gradingData.grade,
        maxPoints: gradingData.maxPoints,
        percentage,
      },
    });
  } catch (error) {
    console.error(
      `Failed to send grading notification to ${gradingData.studentEmail}:`,
      error,
    );
    throw error;
  }
}

// Send assignment due soon reminder to students
export async function sendAssignmentDueSoonReminders(
  assignmentData: AssignmentEmailData,
  studentsWithoutSubmission: Array<{ name: string; email: string; id: string }>,
) {
  const successfulEmails: Parameters<typeof createAuditLogs>[0] = [];

  const emailPromises = studentsWithoutSubmission.map(async (student) => {
    const dueText = assignmentData.dueDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const hoursUntilDue = Math.ceil(
      (assignmentData.dueDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60),
    );
    const urgencyText =
      hoursUntilDue <= 6
        ? "⚠️ Due very soon!"
        : hoursUntilDue <= 24
          ? "🔔 Due soon!"
          : "⏰ Reminder";

    const html = `
      ${getEmailStyles()}
      <div class="container">
        <div class="header">
          <h1>⏰ Assignment Due Soon</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${student.name}</strong>,</p>
          
          <p>This is a friendly reminder that you have an assignment due soon:</p>
          
          <div class="highlight-box urgent-reminder">
            <strong>📚 Course:</strong> ${assignmentData.courseTitle}<br>
            <strong>📋 Assignment:</strong> ${assignmentData.assignmentTitle}<br>
            <strong>⏰ Due:</strong> ${dueText}<br>
            <strong>⚡ Status:</strong> <span class="urgent">${urgencyText}</span>
          </div>
          
          <p><strong>Don't wait!</strong> Submit your assignment before the deadline to avoid any issues.</p>
          
          <div class="cta-section">
            <a href="${APP_URL}/learn/assignment/${assignmentData.assignmentId}" class="cta-button urgent">
              🚀 Submit Now
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>You've got this! 💪</p>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
          <p class="support-text">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" class="link">${SUPPORT_EMAIL}</a></p>
        </div>
      </div>
    `;

    try {
      await sendEmailWithRetry({
        from: FROM_EMAIL,
        to: student.email,
        subject: `⏰ ${urgencyText}: ${assignmentData.assignmentTitle} - Submit Soon!`,
        html,
      });

      successfulEmails.push({
        action: "EMAIL_SENT",
        userId: student.id,
        entityType: "ASSIGNMENT",
        entityId: assignmentData.assignmentId,
        metadata: {
          type: "assignment_due_soon",
          recipientEmail: student.email,
          assignmentTitle: assignmentData.assignmentTitle,
          courseTitle: assignmentData.courseTitle,
          hoursUntilDue,
        },
      });
    } catch (error) {
      console.error(
        `Failed to send due soon reminder to ${student.email}:`,
        error,
      );
      // Don't throw - continue with other emails
    }
  });

  await Promise.allSettled(emailPromises);

  if (successfulEmails.length > 0) {
    await createAuditLogs(successfulEmails);
  }
}

// Email-client compatible CSS styles (Gmail, Outlook, Apple Mail optimized)
const getEmailStyles = () => `
  <style type="text/css">
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body { 
      font-family: 'Courier New', Consolas, Monaco, 'Lucida Console', monospace !important; 
      line-height: 1.6; 
      color: #00ff41 !important; /* Matrix green */
      background-color: #000000 !important;
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-image: 
        radial-gradient(rgba(0, 255, 65, 0.02) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    table { 
      border-collapse: collapse; 
      mso-table-lspace: 0pt; 
      mso-table-rspace: 0pt; 
      width: 100%;
    }
    .container { 
      width: 100%; 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #000000;
      border: 1px solid #00ff41;
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #001100, #002200);
      border: 2px solid #00ff41;
      padding: 25px 20px;
      text-align: center;
      position: relative;
    }
    .header::before {
      content: '> ';
      color: #00ff41;
      font-weight: bold;
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
    }
    .header h1 {
      color: #00ff41;
      font-size: 28px;
      margin: 0;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 10px #00ff41;
      animation: terminal-glow 2s ease-in-out infinite alternate;
    }
    @keyframes terminal-glow {
      from { text-shadow: 0 0 5px #00ff41; }
      to { text-shadow: 0 0 15px #00ff41, 0 0 20px #00ff41; }
    }
    .header .subtitle {
      color: #00cc33;
      font-size: 14px;
      margin: 8px 0 0 0;
      opacity: 0.9;
    }
    .content {
      background-color: #111111;
      border: 1px solid #00ff41;
      padding: 25px;
      margin: 0;
      position: relative;
    }
    .content::before {
      content: 'codezela@lms:~$ ';
      color: #00ff41;
      font-weight: bold;
      display: block;
      margin-bottom: 15px;
      font-size: 14px;
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
      color: #000000 !important; 
      text-decoration: none; 
      margin: 16px 0; 
      font-weight: bold;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      text-align: center;
      border: 2px solid #10b981;
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
      color: #00ff41;
      font-size: 15px;
      line-height: 1.6;
    }
    strong {
      color: #00cc33;
      font-weight: bold;
      text-shadow: 0 0 3px #00cc33;
    }
    .highlight-box {
      background: linear-gradient(135deg, #001100, #002200);
      border: 2px solid #00ff41;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      font-family: 'Courier New', monospace;
      position: relative;
      box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
    }
    .highlight-box::before {
      content: '[INFO]';
      color: #00ff41;
      font-size: 12px;
      font-weight: bold;
      position: absolute;
      top: -10px;
      left: 15px;
      background: #000000;
      padding: 0 8px;
    }
    .urgent-reminder {
      border-color: #ffaa00;
      background: linear-gradient(135deg, #1a1100, #2a1800);
      box-shadow: 0 0 15px rgba(255, 170, 0, 0.3);
    }
    .urgent-reminder::before {
      content: '[URGENT]';
      color: #ffaa00;
    }
    .feedback-section {
      background: linear-gradient(135deg, #0d1a0d, #1a2a1a);
      border: 2px solid #00cc33;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      position: relative;
    }
    .feedback-section::before {
      content: '[FEEDBACK]';
      color: #00cc33;
      font-size: 12px;
      font-weight: bold;
      position: absolute;
      top: -10px;
      left: 15px;
      background: #000000;
      padding: 0 8px;
    }
    .feedback-content {
      background-color: #0a0a0a;
      border-left: 4px solid #00ff41;
      padding: 15px;
      margin-top: 10px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      color: #00cc33;
    }
    .grade-score {
      color: #00ff41;
      font-weight: bold;
      font-size: 18px;
      text-shadow: 0 0 8px #00ff41;
    }
    .success {
      color: #00ff41;
      font-weight: bold;
      text-shadow: 0 0 5px #00ff41;
    }
    .needs-improvement {
      color: #ffaa00;
      font-weight: bold;
      text-shadow: 0 0 5px #ffaa00;
    }
    .urgent {
      color: #ff6600;
      font-weight: bold;
      text-shadow: 0 0 8px #ff6600;
      animation: urgent-pulse 1.5s ease-in-out infinite;
    }
    @keyframes urgent-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .cta-section {
      text-align: center;
      margin: 30px 0;
      padding: 20px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 18px 35px;
      background: linear-gradient(135deg, #00ff41, #00cc33);
      color: #000000 !important;
      text-decoration: none;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      border-radius: 8px;
      border: 2px solid #00ff41;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #00cc33, #00ff41);
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.6);
      transform: translateY(-2px);
    }
    .cta-button.urgent {
      background: linear-gradient(135deg, #ff6600, #ffaa00);
      border-color: #ff6600;
      color: #000000 !important;
      animation: urgent-glow 2s ease-in-out infinite;
    }
    @keyframes urgent-glow {
      0%, 100% { 
        box-shadow: 0 0 20px rgba(255, 102, 0, 0.4);
        transform: scale(1);
      }
      50% { 
        box-shadow: 0 0 30px rgba(255, 102, 0, 0.7);
        transform: scale(1.02);
      }
    }
    .support-text {
      font-size: 12px;
      color: #10b981;
      opacity: 0.8;
      margin-top: 20px;
    }
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
    // Use retry logic for better reliability
    await sendEmailWithRetry(emailData);

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
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Welcome to ${APP_NAME}</title>
        <!--[if mso]>
        <style type="text/css">
          table { border-collapse: collapse; border-spacing: 0; margin: 0; }
          .container { width: 600px !important; }
        </style>
        <![endif]-->
        ${getEmailStyles()}
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Courier New', Consolas, Monaco, monospace; background-color: #000000; color: #16a34a;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000;">
          <tr>
            <td align="center" style="padding: 20px;">
              <!-- Main Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="background-color: #000000; max-width: 600px; margin: 0 auto;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #111111; border: 1px solid #16a34a; padding: 20px; text-align: center;">
                    <h1 style="margin: 0 0 10px 0; color: #16a34a; font-size: 24px; font-weight: bold; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      <span style="color: #16a34a; font-weight: bold;">$</span> Account Created Successfully
                    </h1>
                    <div style="color: #10b981; font-size: 14px; margin: 0;">Welcome to ${APP_NAME}</div>
                  </td>
                </tr>
                
                <!-- ASCII Art -->
                <tr>
                  <td style="padding: 20px 0; text-align: center;">
                    <pre style="color: #16a34a; font-size: 10px; line-height: 1.2; margin: 0; font-family: 'Courier New', Consolas, Monaco, monospace;">${getCodezelaAscii()}</pre>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="background-color: #111111; border: 1px solid #16a34a; padding: 20px;">
                    <p style="margin: 0 0 15px 0; color: #16a34a; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      <span style="color: #16a34a; font-weight: bold;">$</span> Hello <strong style="color: #10b981; font-weight: bold;">${userData.name}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 15px 0; color: #16a34a; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      Your account has been created by <strong style="color: #10b981; font-weight: bold;">${userData.createdBy}</strong>. ${roleWelcomes[userData.role]}
                    </p>
                    
                    <!-- Command Section -->
                    <div style="color: #10b981; background-color: #1a1a1a; padding: 8px 12px; border-left: 3px solid #16a34a; margin: 12px 0;">
                      <span style="color: #16a34a; font-weight: bold;">$</span> Account Details:
                    </div>
                    
                    <!-- Credentials Table -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #1a1a1a; border: 1px solid #16a34a; margin: 15px 0;">
                      <tr>
                        <td style="padding: 15px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="color: #16a34a; font-weight: bold; padding: 5px 0; width: 100px; font-family: 'Courier New', Consolas, Monaco, monospace;">Email:</td>
                              <td style="color: #10b981; font-weight: bold; padding: 5px 0; font-family: 'Courier New', Consolas, Monaco, monospace;">${userData.email}</td>
                            </tr>
                            <tr>
                              <td style="color: #16a34a; font-weight: bold; padding: 5px 0; width: 100px; font-family: 'Courier New', Consolas, Monaco, monospace;">Role:</td>
                              <td style="color: #10b981; font-weight: bold; padding: 5px 0; font-family: 'Courier New', Consolas, Monaco, monospace;">${userData.role}</td>
                            </tr>
                            <tr>
                              <td style="color: #16a34a; font-weight: bold; padding: 5px 0; width: 100px; font-family: 'Courier New', Consolas, Monaco, monospace;">Password:</td>
                              <td style="color: #10b981; font-weight: bold; padding: 5px 0; font-family: 'Courier New', Consolas, Monaco, monospace; word-break: break-all;">${userData.password}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Warning -->
                    <div style="background-color: #1a1a0d; border: 1px solid #eab308; color: #facc15; padding: 12px; margin: 12px 0; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      <strong>🔐 Important Security Information:</strong><br>
                      • Please log in immediately and change your password<br>
                      • Store your credentials securely<br>
                      • Never share your login details with others
                    </div>
                    
                    <!-- Role Permissions -->
                    <div style="color: #10b981; background-color: #1a1a1a; padding: 8px 12px; border-left: 3px solid #16a34a; margin: 12px 0;">
                      <span style="color: #16a34a; font-weight: bold;">$</span> Role Permissions: ${roleDescriptions[userData.role]}
                    </div>
                    
                    <!-- Quick Start Guide -->
                    <p style="margin: 15px 0 10px 0; color: #16a34a; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      <strong style="color: #10b981; font-weight: bold;">Quick Start Guide:</strong>
                    </p>
                    <ul style="margin: 0 0 15px 20px; padding: 0; color: #10b981; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      <li style="margin-bottom: 8px;">Click the login button below or visit: <span style="background-color: #1a1a1a; color: #16a34a; padding: 2px 6px; border: 1px solid #333; font-family: 'Courier New', Consolas, Monaco, monospace;">${loginUrl}</span></li>
                      <li style="margin-bottom: 8px;">Use your email and the provided password to sign in</li>
                      <li style="margin-bottom: 8px;">Update your password in Settings for security</li>
                      <li style="margin-bottom: 8px;">Complete your profile information</li>
                      ${userData.role === "STUDENT" ? '<li style="margin-bottom: 8px;">Check your assigned courses in "My Programmes"</li>' : ""}
                      ${userData.role === "LECTURER" ? '<li style="margin-bottom: 8px;">Start creating your first course in "Programmes"</li>' : ""}
                      ${userData.role === "ADMIN" ? '<li style="margin-bottom: 8px;">Explore the admin dashboard and user management</li>' : ""}
                    </ul>
                    
                    <!-- Login Button -->
                    <div style="text-align: center; margin: 20px 0;">
                      <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #000000 !important; text-decoration: none; font-weight: bold; font-family: 'Courier New', Consolas, Monaco, monospace; border: 2px solid #10b981;">
                        <span style="color: #000000; font-weight: bold;">$</span> LOGIN TO PLATFORM
                      </a>
                    </div>
                    
                    <!-- Links -->
                    <p style="margin: 15px 0; color: #16a34a; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      Direct login link: <a href="${loginUrl}" style="color: #10b981; text-decoration: underline; word-break: break-all;">${loginUrl}</a>
                    </p>
                    <p style="margin: 15px 0; color: #16a34a; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      Dashboard: <a href="${dashboardUrl}" style="color: #10b981; text-decoration: underline; word-break: break-all;">${dashboardUrl}</a>
                    </p>
                    
                    <!-- Security Notice -->
                    <div style="background-color: #1a0d0d; border: 1px solid #dc2626; color: #ef4444; padding: 12px; margin: 12px 0; font-family: 'Courier New', Consolas, Monaco, monospace;">
                      <strong>⚠️ Security Notice:</strong> This email contains sensitive login information. Please delete this email after saving your credentials securely.
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 20px 20px 20px; border-top: 1px solid #16a34a; font-size: 12px; color: #10b981; text-align: center; font-family: 'Courier New', Consolas, Monaco, monospace;">
                    <p style="margin: 0 0 10px 0;"><strong style="color: #10b981;">${APP_NAME}</strong></p>
                    <p style="margin: 0 0 10px 0;">Developed with ❤️ by <a href="https://codezela.com" style="color: #16a34a; text-decoration: none;">Codezela Technologies</a></p>
                    <p style="margin: 0;">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #16a34a; text-decoration: none;">${SUPPORT_EMAIL}</a></p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
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
