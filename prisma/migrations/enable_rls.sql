-- ============================================================================
-- Row-Level Security (RLS) - Auto-applied by seed script
-- ============================================================================
-- Enables RLS on all tables with role-based policies
-- Run via: npm run db:seed (automatically executed)
-- ============================================================================

-- Helper function: Get current user ID from session/context
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('app.current_user_id', true),
    ''
  )::text;
$$ LANGUAGE sql STABLE;

-- Helper function: Get current user role
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role::text FROM "User" WHERE id = current_user_id()),
    ''
  );
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonResource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResourceVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubmissionAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UploadedFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "user_view_own" ON "User";
DROP POLICY IF EXISTS "user_view_shared" ON "User";
DROP POLICY IF EXISTS "user_view_all" ON "User";
DROP POLICY IF EXISTS "user_update_own" ON "User";

CREATE POLICY "user_view_own" ON "User" FOR SELECT
  USING (id = current_user_id());

CREATE POLICY "user_view_shared" ON "User" FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT u.id FROM "User" u
      INNER JOIN "CourseEnrollment" ce ON ce."userId" = u.id
      WHERE ce."courseId" IN (
        SELECT "courseId" FROM "CourseEnrollment" WHERE "userId" = current_user_id()
      )
    )
  );

CREATE POLICY "user_view_all" ON "User" FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'LECTURER'));

CREATE POLICY "user_update_own" ON "User" FOR UPDATE
  USING (id = current_user_id());

-- ============================================================================
-- ACCOUNT POLICIES (NextAuth)
-- ============================================================================

DROP POLICY IF EXISTS "account_own" ON "Account";
CREATE POLICY "account_own" ON "Account" FOR ALL
  USING ("userId" = current_user_id());

-- ============================================================================
-- SESSION POLICIES (NextAuth)
-- ============================================================================

DROP POLICY IF EXISTS "session_own" ON "Session";
CREATE POLICY "session_own" ON "Session" FOR ALL
  USING ("userId" = current_user_id());

-- ============================================================================
-- VERIFICATION TOKEN POLICIES (NextAuth)
-- ============================================================================

DROP POLICY IF EXISTS "verification_public" ON "VerificationToken";
CREATE POLICY "verification_public" ON "VerificationToken" FOR ALL
  USING (true);

-- ============================================================================
-- COURSE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "course_view_published" ON "Course";
DROP POLICY IF EXISTS "course_view_own" ON "Course";
DROP POLICY IF EXISTS "course_manage_own" ON "Course";

CREATE POLICY "course_view_published" ON "Course" FOR SELECT
  USING (status = 'PUBLISHED');

CREATE POLICY "course_view_own" ON "Course" FOR SELECT
  USING ("lecturerId" = current_user_id() OR current_user_role() = 'ADMIN');

CREATE POLICY "course_manage_own" ON "Course" FOR ALL
  USING ("lecturerId" = current_user_id() OR current_user_role() = 'ADMIN');

-- ============================================================================
-- MODULE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "module_view" ON "Module";
DROP POLICY IF EXISTS "module_manage" ON "Module";

CREATE POLICY "module_view" ON "Module" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Course" c
      WHERE c.id = "Module"."courseId"
      AND (
        c.status = 'PUBLISHED'
        OR c."lecturerId" = current_user_id()
        OR current_user_role() = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM "CourseEnrollment"
          WHERE "courseId" = c.id AND "userId" = current_user_id()
        )
      )
    )
  );

CREATE POLICY "module_manage" ON "Module" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Course"
      WHERE id = "Module"."courseId"
      AND ("lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- LESSON POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "lesson_view" ON "Lesson";
DROP POLICY IF EXISTS "lesson_manage" ON "Lesson";

CREATE POLICY "lesson_view" ON "Lesson" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Module" m
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE m.id = "Lesson"."moduleId"
      AND (
        ("Lesson"."isPublished" = true AND c.status = 'PUBLISHED')
        OR c."lecturerId" = current_user_id()
        OR current_user_role() = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM "CourseEnrollment"
          WHERE "courseId" = c.id AND "userId" = current_user_id()
        )
      )
    )
  );

CREATE POLICY "lesson_manage" ON "Lesson" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Module" m
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE m.id = "Lesson"."moduleId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- LESSON RESOURCE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "resource_view" ON "LessonResource";
DROP POLICY IF EXISTS "resource_manage" ON "LessonResource";

CREATE POLICY "resource_view" ON "LessonResource" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Lesson" l
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE l.id = "LessonResource"."lessonId"
      AND (
        (l."isPublished" = true AND c.status = 'PUBLISHED')
        OR c."lecturerId" = current_user_id()
        OR current_user_role() = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM "CourseEnrollment"
          WHERE "courseId" = c.id AND "userId" = current_user_id()
        )
      )
    )
  );

CREATE POLICY "resource_manage" ON "LessonResource" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Lesson" l
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE l.id = "LessonResource"."lessonId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- RESOURCE VERSION POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "resource_version_view" ON "ResourceVersion";
DROP POLICY IF EXISTS "resource_version_manage" ON "ResourceVersion";

CREATE POLICY "resource_version_view" ON "ResourceVersion" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "LessonResource" lr
      INNER JOIN "Lesson" l ON l.id = lr."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE lr.id = "ResourceVersion"."resourceId"
      AND (
        (l."isPublished" = true AND c.status = 'PUBLISHED')
        OR c."lecturerId" = current_user_id()
        OR current_user_role() = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM "CourseEnrollment"
          WHERE "courseId" = c.id AND "userId" = current_user_id()
        )
      )
    )
  );

CREATE POLICY "resource_version_manage" ON "ResourceVersion" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "LessonResource" lr
      INNER JOIN "Lesson" l ON l.id = lr."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE lr.id = "ResourceVersion"."resourceId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- QUIZ POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "quiz_view" ON "Quiz";
DROP POLICY IF EXISTS "quiz_manage" ON "Quiz";

CREATE POLICY "quiz_view" ON "Quiz" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Lesson" l
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE l.id = "Quiz"."lessonId"
      AND (
        (l."isPublished" = true AND c.status = 'PUBLISHED')
        OR c."lecturerId" = current_user_id()
        OR current_user_role() = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM "CourseEnrollment"
          WHERE "courseId" = c.id AND "userId" = current_user_id()
        )
      )
    )
  );

CREATE POLICY "quiz_manage" ON "Quiz" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Lesson" l
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE l.id = "Quiz"."lessonId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- QUIZ QUESTION POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "quiz_question_view" ON "QuizQuestion";
DROP POLICY IF EXISTS "quiz_question_manage" ON "QuizQuestion";

CREATE POLICY "quiz_question_view" ON "QuizQuestion" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Quiz" q
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE q.id = "QuizQuestion"."quizId"
      AND (
        (l."isPublished" = true AND c.status = 'PUBLISHED')
        OR c."lecturerId" = current_user_id()
        OR current_user_role() = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM "CourseEnrollment"
          WHERE "courseId" = c.id AND "userId" = current_user_id()
        )
      )
    )
  );

CREATE POLICY "quiz_question_manage" ON "QuizQuestion" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Quiz" q
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE q.id = "QuizQuestion"."quizId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- QUIZ ANSWER POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "quiz_answer_view" ON "QuizAnswer";
DROP POLICY IF EXISTS "quiz_answer_manage" ON "QuizAnswer";

CREATE POLICY "quiz_answer_view" ON "QuizAnswer" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "QuizQuestion" qq
      INNER JOIN "Quiz" q ON q.id = qq."quizId"
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE qq.id = "QuizAnswer"."questionId"
      AND (
        (l."isPublished" = true AND c.status = 'PUBLISHED')
        OR c."lecturerId" = current_user_id()
        OR current_user_role() = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM "CourseEnrollment"
          WHERE "courseId" = c.id AND "userId" = current_user_id()
        )
      )
    )
  );

CREATE POLICY "quiz_answer_manage" ON "QuizAnswer" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "QuizQuestion" qq
      INNER JOIN "Quiz" q ON q.id = qq."quizId"
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE qq.id = "QuizAnswer"."questionId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- QUIZ ATTEMPT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "quiz_attempt_view_own" ON "QuizAttempt";
DROP POLICY IF EXISTS "quiz_attempt_view_course" ON "QuizAttempt";
DROP POLICY IF EXISTS "quiz_attempt_manage_own" ON "QuizAttempt";
DROP POLICY IF EXISTS "quiz_attempt_manage_lecturer" ON "QuizAttempt";

CREATE POLICY "quiz_attempt_view_own" ON "QuizAttempt" FOR SELECT
  USING ("userId" = current_user_id());

CREATE POLICY "quiz_attempt_view_course" ON "QuizAttempt" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Quiz" q
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE q.id = "QuizAttempt"."quizId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "quiz_attempt_manage_own" ON "QuizAttempt" FOR ALL
  USING ("userId" = current_user_id());

CREATE POLICY "quiz_attempt_manage_lecturer" ON "QuizAttempt" FOR UPDATE
  USING (
    "userId" = current_user_id()
    OR EXISTS (
      SELECT 1 FROM "Quiz" q
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE q.id = "QuizAttempt"."quizId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- QUIZ RESPONSE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "quiz_response_view_own" ON "QuizResponse";
DROP POLICY IF EXISTS "quiz_response_view_lecturer" ON "QuizResponse";
DROP POLICY IF EXISTS "quiz_response_manage_own" ON "QuizResponse";
DROP POLICY IF EXISTS "quiz_response_manage_lecturer" ON "QuizResponse";

CREATE POLICY "quiz_response_view_own" ON "QuizResponse" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "QuizAttempt"
      WHERE id = "QuizResponse"."attemptId"
      AND "userId" = current_user_id()
    )
  );

CREATE POLICY "quiz_response_view_lecturer" ON "QuizResponse" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "QuizAttempt" qa
      INNER JOIN "Quiz" q ON q.id = qa."quizId"
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE qa.id = "QuizResponse"."attemptId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "quiz_response_manage_own" ON "QuizResponse" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "QuizAttempt"
      WHERE id = "QuizResponse"."attemptId"
      AND "userId" = current_user_id()
    )
  );

CREATE POLICY "quiz_response_manage_lecturer" ON "QuizResponse" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "QuizAttempt" qa
      INNER JOIN "Quiz" q ON q.id = qa."quizId"
      INNER JOIN "Lesson" l ON l.id = q."lessonId"
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE qa.id = "QuizResponse"."attemptId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- COURSE ENROLLMENT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "enrollment_view_own" ON "CourseEnrollment";
DROP POLICY IF EXISTS "enrollment_view_course" ON "CourseEnrollment";
DROP POLICY IF EXISTS "enrollment_manage_own" ON "CourseEnrollment";
DROP POLICY IF EXISTS "enrollment_manage_course" ON "CourseEnrollment";

CREATE POLICY "enrollment_view_own" ON "CourseEnrollment" FOR SELECT
  USING ("userId" = current_user_id());

CREATE POLICY "enrollment_view_course" ON "CourseEnrollment" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Course"
      WHERE id = "CourseEnrollment"."courseId"
      AND ("lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "enrollment_manage_own" ON "CourseEnrollment" FOR ALL
  USING ("userId" = current_user_id());

CREATE POLICY "enrollment_manage_course" ON "CourseEnrollment" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Course"
      WHERE id = "CourseEnrollment"."courseId"
      AND ("lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- LESSON PROGRESS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "progress_view_own" ON "LessonProgress";
DROP POLICY IF EXISTS "progress_view_course" ON "LessonProgress";
DROP POLICY IF EXISTS "progress_manage_own" ON "LessonProgress";

CREATE POLICY "progress_view_own" ON "LessonProgress" FOR SELECT
  USING ("userId" = current_user_id());

CREATE POLICY "progress_view_course" ON "LessonProgress" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Lesson" l
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE l.id = "LessonProgress"."lessonId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "progress_manage_own" ON "LessonProgress" FOR ALL
  USING ("userId" = current_user_id());

-- ============================================================================
-- SUBMISSION POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "submission_view_own" ON "Submission";
DROP POLICY IF EXISTS "submission_view_course" ON "Submission";
DROP POLICY IF EXISTS "submission_manage_own" ON "Submission";
DROP POLICY IF EXISTS "submission_manage_lecturer" ON "Submission";

CREATE POLICY "submission_view_own" ON "Submission" FOR SELECT
  USING ("userId" = current_user_id());

CREATE POLICY "submission_view_course" ON "Submission" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Lesson" l
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE l.id = "Submission"."lessonId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "submission_manage_own" ON "Submission" FOR INSERT
  WITH CHECK ("userId" = current_user_id());

CREATE POLICY "submission_manage_lecturer" ON "Submission" FOR UPDATE
  USING (
    "userId" = current_user_id()
    OR EXISTS (
      SELECT 1 FROM "Lesson" l
      INNER JOIN "Module" m ON m.id = l."moduleId"
      INNER JOIN "Course" c ON c.id = m."courseId"
      WHERE l.id = "Submission"."lessonId"
      AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
    )
  );

-- ============================================================================
-- SUBMISSION ATTACHMENT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "attachment_view" ON "SubmissionAttachment";
DROP POLICY IF EXISTS "attachment_manage" ON "SubmissionAttachment";

CREATE POLICY "attachment_view" ON "SubmissionAttachment" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Submission" s
      WHERE s.id = "SubmissionAttachment"."submissionId"
      AND (
        s."userId" = current_user_id()
        OR EXISTS (
          SELECT 1 FROM "Lesson" l
          INNER JOIN "Module" m ON m.id = l."moduleId"
          INNER JOIN "Course" c ON c.id = m."courseId"
          WHERE l.id = s."lessonId"
          AND (c."lecturerId" = current_user_id() OR current_user_role() = 'ADMIN')
        )
      )
    )
  );

CREATE POLICY "attachment_manage" ON "SubmissionAttachment" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Submission"
      WHERE id = "SubmissionAttachment"."submissionId"
      AND "userId" = current_user_id()
    )
  );

-- ============================================================================
-- UPLOADED FILE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "file_view_own" ON "UploadedFile";
DROP POLICY IF EXISTS "file_view_all" ON "UploadedFile";
DROP POLICY IF EXISTS "file_manage_own" ON "UploadedFile";

CREATE POLICY "file_view_own" ON "UploadedFile" FOR SELECT
  USING ("userId" = current_user_id());

CREATE POLICY "file_view_all" ON "UploadedFile" FOR SELECT
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "file_manage_own" ON "UploadedFile" FOR ALL
  USING ("userId" = current_user_id());

-- ============================================================================
-- NOTIFICATION POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "notification_view_own" ON "Notification";
DROP POLICY IF EXISTS "notification_manage_own" ON "Notification";
DROP POLICY IF EXISTS "notification_create" ON "Notification";

CREATE POLICY "notification_view_own" ON "Notification" FOR SELECT
  USING ("userId" = current_user_id());

CREATE POLICY "notification_manage_own" ON "Notification" FOR UPDATE
  USING ("userId" = current_user_id());

CREATE POLICY "notification_create" ON "Notification" FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'LECTURER'));

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "audit_view_admin" ON "AuditLog";
DROP POLICY IF EXISTS "audit_insert_all" ON "AuditLog";

CREATE POLICY "audit_view_admin" ON "AuditLog" FOR SELECT
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "audit_insert_all" ON "AuditLog" FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- DONE
-- ============================================================================
