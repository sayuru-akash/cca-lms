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
