# 🎓 CCA LMS - Codezela Career Accelerator

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-316192?style=for-the-badge&logo=postgresql)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)

**Enterprise-Grade Learning Management System with Terminal Aesthetic**

[Live Demo](https://lms.cca.it.com) • [Documentation](#-table-of-contents) • [API Reference](#-api-reference)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Getting Started](#-getting-started)
- [Database Schema](#️-database-schema)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Security](#-security)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

CCA LMS is a **production-ready Learning Management System** designed for educational institutions and corporate training programs. Built with cutting-edge technologies and featuring a unique **terminal/hacker aesthetic**, it provides a complete platform for course management, student tracking, assessments, and resource distribution.

### Key Highlights

- ✅ **Production-Ready**: Deployed on Vercel Edge Runtime
- ✅ **Type-Safe**: Full TypeScript with Prisma generated types
- ✅ **Secure**: Row-Level Security (RLS), NextAuth v5, Audit Logging
- ✅ **Scalable**: Optimized with Turbopack and Server Components
- ✅ **Modern**: Next.js 16+ with App Router and React 19

### Live Credentials

```
Admin:
  Email: admin@codezela.com
  Password: Admin@123

Lecturer:
  Email: lecturer@codezela.com
  Password: Lecturer@123

Student:
  Email: student@codezela.com
  Password: Student@123
```

---

## ✨ Features

### 🎓 Core LMS Functionality

#### **Programme Management**

- ✅ Create multi-module educational programmes
- ✅ Drag-and-drop module and lesson reordering
- ✅ Course visibility controls (Draft, Published, Archived)
- ✅ Enrollment tracking and capacity management
- ✅ Programme-level analytics dashboard

#### **Content Delivery**

- ✅ **Lesson Types**: Video, Reading, Quiz, Assignment
- ✅ Rich text content with markdown support
- ✅ Video embedding (YouTube, Vimeo, etc.)
- ✅ Scheduled content release
- ✅ Lesson progress tracking

#### **Quiz System** 🎯 (Production-Level)

**Quiz Builder (Lecturer/Admin)**:

- 4 Question Types:
  - **Multiple Choice**: Single correct answer with radio buttons
  - **True/False**: Binary questions
  - **Short Answer**: Text input (manual grading)
  - **Long Answer**: Essay-style (manual grading)
- Visual question editor with drag-and-drop
- Answer management with correct/incorrect marking
- Question settings: points, explanations, order
- Quiz settings:
  - Time limits (minutes)
  - Passing score (percentage)
  - Maximum attempts
  - Question shuffling
  - Answer shuffling
  - Show/hide results

**Quiz Player (Student)**:

- Countdown timer with auto-submit
- Question navigation with progress indicator
- Save and resume support
- Visual feedback for answered questions
- Instant results for auto-graded questions
- Score breakdown and pass/fail indicator

**Grading System**:

- **Auto-Grading**: Instant scoring for MC and T/F
- **Manual Grading**: Lecturer interface for text answers
- **Result Display**: Score, percentage, passed status
- **Question Review**: See correct/incorrect answers

#### **Resource Management** 📁 (Full CRUD)

**Resource Types**:

1. **FILE**: Upload files to Cloudflare R2
   - Drag-and-drop interface
   - 500MB file size limit
   - Progress bar during upload
   - Automatic file type detection
2. **EXTERNAL_LINK**: Add web resources
3. **EMBEDDED**: Embed iframes/videos
4. **TEXT_NOTE**: Rich text notes

**Features**:

- ✅ Drag-and-drop reordering
- ✅ Edit resource metadata (title, description)
- ✅ Visibility controls (Public, Scheduled, Hidden)
- ✅ Downloadable toggle for files
- ✅ Version history tracking
- ✅ Signed URLs for secure file downloads
- ✅ Delete with confirmation

### 👥 Role-Based Access Control

#### **Admin** 🔑

- Full system access and configuration
- User management (CRUD operations)
- Programme creation and management
- System-wide analytics and reports
- Audit log access
- Security settings

#### **Lecturer** 👨‍🏫

- Create and manage own programmes
- Student enrollment management
- Grade submissions and quizzes (manual grading)
- Upload and manage resources
- Class analytics and progress tracking
- Communication tools

#### **Student** 🎓

- Browse and enroll in programmes
- Access lessons and resources
- Take quizzes and submit assignments
- Track own progress
- View grades and feedback
- Download course materials

### 🎨 Terminal Aesthetic UI

- **Dark/Light Mode**: Seamless theme switching
- **Terminal Green**: Signature `#00FF41` accent color
- **Monospace Fonts**: JetBrains Mono, Fira Code
- **Glow Effects**: Terminal-style text shadows
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliant

### 🔐 Security Features

- **Authentication**: NextAuth.js v5 with JWT
- **Row-Level Security**: PostgreSQL RLS policies
- **Audit Logging**: Track all user actions with metadata
- **Password Security**: bcrypt hashing (10 rounds)
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: Built-in Next.js security
- **File Upload Security**: Type and size validation
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Protection**: React automatic escaping

---

## 🛠️ Tech Stack

### Core Framework

| Technology     | Version | Purpose                           |
| -------------- | ------- | --------------------------------- |
| **Next.js**    | 16.1.4  | React framework with App Router   |
| **React**      | 19.2.3  | UI library with Server Components |
| **TypeScript** | 5.7     | Type safety and IntelliSense      |
| **Turbopack**  | Latest  | Fast development bundler          |

### Backend & Database

| Technology      | Version       | Purpose                       |
| --------------- | ------------- | ----------------------------- |
| **PostgreSQL**  | 14+           | Primary relational database   |
| **Prisma**      | 6.19.2        | Type-safe ORM with migrations |
| **NextAuth.js** | 5.0.0-beta.30 | Authentication framework      |
| **bcryptjs**    | 3.0.3         | Password hashing              |
| **Zod**         | 4.3.6         | Runtime type validation       |

### Cloud Services

| Service           | Purpose                      |
| ----------------- | ---------------------------- |
| **Vercel**        | Hosting with Edge Runtime    |
| **Supabase**      | PostgreSQL database with RLS |
| **Cloudflare R2** | S3-compatible file storage   |
| **Resend**        | Transactional email service  |

### UI & Styling

| Technology         | Purpose                         |
| ------------------ | ------------------------------- | --------------------- |
| **Tailwind CSS**   | 4.0                             | Utility-first styling |
| **Radix UI**       | Accessible component primitives |
| **Lucide React**   | Icon library (1000+ icons)      |
| **next-themes**    | Dark/Light mode switching       |
| **Sonner**         | Toast notifications             |
| **react-dropzone** | File upload component           |

---

## 🏗️ Architecture

### Project Structure

```
cca-lms/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Edge Runtime)
│   │   ├── admin/               # Admin-only endpoints
│   │   │   ├── programmes/      # Programme CRUD
│   │   │   ├── modules/         # Module CRUD + reorder
│   │   │   ├── lessons/         # Lesson CRUD + reorder
│   │   │   ├── quizzes/         # Quiz management
│   │   │   ├── resources/       # Resource CRUD + reorder
│   │   │   └── users/           # User management
│   │   ├── auth/                # NextAuth handlers
│   │   └── quizzes/             # Student quiz endpoints
│   ├── auth/                     # Auth pages
│   ├── dashboard/                # Dashboard (role-specific)
│   ├── programmes/               # Programme pages
│   ├── users/                    # User management
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React Components
│   ├── dashboards/              # Admin/Lecturer/Student dashboards
│   ├── programmes/              # Programme content management
│   ├── quizzes/                 # Quiz builder & player
│   │   ├── quiz-builder.tsx     # Question editor (673 lines)
│   │   └── quiz-player.tsx      # Quiz taking UI (530 lines)
│   ├── resources/               # Resource management
│   │   ├── resource-manager.tsx # Resource CRUD UI (468 lines)
│   │   └── file-upload.tsx      # File upload component (338 lines)
│   ├── users/                   # User management UI
│   ├── ui/                      # Reusable UI components
│   ├── navbar.tsx               # Role-based navigation
│   ├── footer.tsx               # Footer
│   ├── theme-provider.tsx       # Theme context
│   └── theme-toggle.tsx         # Dark/Light toggle
├── lib/                          # Utility Libraries
│   ├── auth.ts                  # NextAuth configuration
│   ├── prisma.ts                # Prisma client singleton
│   ├── r2.ts                    # Cloudflare R2 client
│   ├── resend.ts                # Email client
│   ├── audit.ts                 # Audit logging utilities
│   ├── utils.ts                 # Helper functions
│   └── validations.ts           # Zod schemas
├── prisma/                       # Database
│   ├── schema.prisma            # Database schema (21 models)
│   ├── seed.ts                  # Seed data script
│   ├── migrations/              # SQL migrations
│   │   └── enable_rls.sql       # RLS policies (21 tables)
│   └── verify_rls.sql           # RLS verification script
├── generated/                    # Prisma generated types
│   └── prisma/                  # Type-safe Prisma client
├── public/                       # Static assets
├── types/                        # TypeScript definitions
│   └── next-auth.d.ts           # NextAuth type extensions
├── .env                          # Environment variables
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies & scripts
```

### Data Flow Architecture

```
┌─────────────┐
│   Browser   │ User interacts with UI
│   (Client)  │
└──────┬──────┘
       │ HTTP Request (fetch/form)
       ↓
┌──────────────────────┐
│   Next.js Server     │ Server Components
│  (Edge Runtime)      │ • RSC Payload
├──────────────────────┤ • Data Fetching
│   API Routes         │ • Streaming
│   • NextAuth         │
│   • Authorization    │
│   • Validation       │
└──────┬───────────────┘
       │ Prisma Query
       ↓
┌──────────────────────┐
│   PostgreSQL         │ Supabase
│   (Supabase)         │ • RLS Policies
├──────────────────────┤ • Audit Triggers
│   • 21 Models        │ • Connection Pooling
│   • RLS Enabled      │ • Backups
│   • Audit Logs       │
└──────┬───────────────┘
       │
       ↓ External Services
┌──────────────────────┐
│   Cloud Services     │
├──────────────────────┤
│   • R2 (Files)       │ Cloudflare R2
│   • Resend (Email)   │ Transactional Email
└──────────────────────┘
```

### Authentication Flow

```
1. User → Submit Credentials
   ↓
2. POST /api/auth/callback/credentials
   ↓
3. NextAuth Credential Provider
   • Validate email/password
   • Check user status (ACTIVE)
   ↓
4. Prisma Query: findUnique User
   ↓
5. bcrypt.compare(password, hash)
   ↓
6. Generate JWT Token
   • id, email, role
   • 30 day expiration
   ↓
7. Set Secure Cookie
   • HTTP-only
   • Secure (production)
   • SameSite: Lax
   ↓
8. Redirect to Dashboard
   ↓
9. Subsequent Requests
   • Middleware validates JWT
   • auth() helper in Server Components
   • getSession() in Client Components
```

### Database Schema Overview

**21 Models:**

- **Auth**: User, Account, Session, VerificationToken
- **Course**: Course, Module, Lesson, LessonResource, ResourceVersion
- **Quiz**: Quiz, QuizQuestion, QuizAnswer, QuizAttempt, QuizResponse
- **Enrollment**: CourseEnrollment, LessonProgress
- **Assignment**: Submission, SubmissionAttachment
- **File**: UploadedFile
- **System**: Notification, AuditLog

**RLS Security:** All 21 tables have Row-Level Security enabled with role-based policies

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **PostgreSQL**: 14.x or higher (or Supabase account)
- **Git**: Latest version
- **Cloudflare Account**: For R2 storage
- **Resend Account**: For emails (optional)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-org/cca-lms.git
cd cca-lms
```

#### 2. Install Dependencies

```bash
npm install
```

This installs:

- Next.js 16.1.4
- React 19.2.3
- Prisma 6.19.2
- All UI components and utilities

#### 3. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

**Edit `.env` with your credentials:**

```bash
# ============================================================================
# Database - Supabase PostgreSQL
# ============================================================================
# Pooler connection (port 6543) - for application queries
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (port 5432) - for migrations and schema operations
DIRECT_DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres"

# ⚠️ URL-encode special characters in password:
# ! → %21, @ → %40, # → %23, $ → %24, % → %25, ^ → %5E, & → %26, * → %2A, ? → %3F

# ============================================================================
# NextAuth Configuration
# ============================================================================
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-32-character-base64-secret"

# ⚠️ IMPORTANT: DO NOT set NEXTAUTH_URL when using trustHost: true
# With trustHost: true, NextAuth automatically detects the host
# This allows the app to work on:
#   - localhost:3000 (development)
#   - Vercel preview URLs (*.vercel.app)
#   - Production domain (lms.cca.it.com)
# Setting NEXTAUTH_URL will BREAK dynamic host detection!

# ============================================================================
# Cloudflare R2 Storage (S3-Compatible)
# ============================================================================
# Get from: Cloudflare Dashboard → R2 → Manage R2 API Tokens
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="cca-lms-uploads"
R2_REGION="auto"

# Optional: Custom R2 public domain (for direct file access)
# R2_PUBLIC_URL="https://files.yourdomain.com"

# ============================================================================
# Resend Email Service
# ============================================================================
# Get API key from: https://resend.com/api-keys
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# ============================================================================
# Application Configuration
# ============================================================================
APP_NAME="CCA LMS"
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

#### 4. Setup Database

```bash
# Generate Prisma client (creates type-safe client)
npm run db:generate

# Push schema to database (creates all 21 tables)
npm run db:push

# Apply Row-Level Security policies
# Seed initial data (creates admin, lecturer, student users)
npm run db:seed
```

**Default Users Created:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@codezela.com | Admin@123 |
| Lecturer | lecturer@codezela.com | Lecturer@123 |
| Student | student@codezela.com | Student@123 |

**What db:seed does:**

1. Creates 3 default users with hashed passwords
2. Executes `prisma/migrations/enable_rls.sql`
3. Enables Row-Level Security on all 21 tables
4. Creates role-based policies for data isolation

#### 5. Run Development Server

```bash
npm run dev
```

**Visit:** http://localhost:3000

**Test:**

1. Login as admin (admin@codezela.com / Admin@123)
2. Create a programme
3. Add modules and lessons
4. Upload resources
5. Create a quiz

### Verify Installation

```bash
# Check database connection
npm run db:studio
# Opens Prisma Studio at http://localhost:5555

# Check build (should compile without errors)
npm run build

# Verify RLS policies
psql $DATABASE_URL -f prisma/verify_rls.sql
```

---

## 🗄️ Database Schema

### Core Models (21 Total)

#### **Authentication Models**

**User**

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String?   // bcrypt hashed
  role          UserRole  // ADMIN, LECTURER, STUDENT
  status        AccountStatus // ACTIVE, SUSPENDED, PENDING
  image         String?
  emailVerified DateTime?
  lastLogin     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  courses       Course[]
  enrollments   CourseEnrollment[]
  progress      LessonProgress[]
  quizAttempts  QuizAttempt[]
  auditLogs     AuditLog[]
}
```

**Account, Session, VerificationToken**: NextAuth.js models

#### **Course Models**

**Course** (renamed from Programme in UI)

```prisma
model Course {
  id              String   @id @default(cuid())
  title           String
  description     String?  @db.Text
  thumbnail       String?
  status          CourseStatus // DRAFT, PUBLISHED, ARCHIVED
  lecturerId      String
  startDate       DateTime?
  endDate         DateTime?
  enrollmentLimit Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  lecturer        User      @relation(fields: [lecturerId], references: [id])
  modules         Module[]
  enrollments     CourseEnrollment[]
}
```

**Module**

```prisma
model Module {
  id          String   @id @default(cuid())
  courseId    String
  title       String
  description String?  @db.Text
  order       Int      // For drag-and-drop sorting
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons     Lesson[]
}
```

**Lesson**

```prisma
model Lesson {
  id           String   @id @default(cuid())
  moduleId     String
  title        String
  description  String?  @db.Text
  type         LessonType // VIDEO, READING, QUIZ, ASSIGNMENT
  content      String?  @db.Text
  videoUrl     String?
  duration     Int      // Minutes
  order        Int      // For drag-and-drop sorting
  isPublished  Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  module       Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  resources    LessonResource[]
  quiz         Quiz?
  progress     LessonProgress[]
  submissions  Submission[]
}
```

#### **Resource Models**

**LessonResource**

```prisma
model LessonResource {
  id           String   @id @default(cuid())
  lessonId     String
  title        String
  description  String?  @db.Text
  type         ResourceType // FILE, EXTERNAL_LINK, EMBEDDED, TEXT_NOTE
  fileKey      String?  // R2 storage key
  fileName     String?
  fileSize     Int?     // Bytes
  mimeType     String?
  externalUrl  String?
  embedCode    String?  @db.Text
  textContent  String?  @db.Text
  visibility   AssetVisibility // PUBLIC, SCHEDULED, HIDDEN
  scheduledAt  DateTime?
  downloadable Boolean  @default(true)
  tags         String[] // Array for filtering
  order        Int
  version      Int      @default(1)
  isLatest     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  lesson       Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  versions     ResourceVersion[]
}
```

**ResourceVersion** (File version history)

```prisma
model ResourceVersion {
  id          String   @id @default(cuid())
  resourceId  String
  version     Int
  fileKey     String?  // R2 file key
  fileName    String?
  fileSize    Int?
  mimeType    String?
  uploadedBy  String?  // User ID
  createdAt   DateTime @default(now())

  // Relations
  resource    LessonResource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([resourceId, version])
}
```

#### **Quiz Models**

**Quiz**

```prisma
model Quiz {
  id               String   @id @default(cuid())
  lessonId         String   @unique
  title            String
  description      String?  @db.Text
  timeLimit        Int?     // Minutes
  passingScore     Int      @default(70) // Percentage
  maxAttempts      Int?     // null = unlimited
  shuffleQuestions Boolean  @default(false)
  shuffleAnswers   Boolean  @default(false)
  showResults      Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  lesson           Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  questions        QuizQuestion[]
  attempts         QuizAttempt[]
}
```

**QuizQuestion**

```prisma
model QuizQuestion {
  id          String   @id @default(cuid())
  quizId      String
  type        QuestionType // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, LONG_ANSWER
  question    String   @db.Text
  explanation String?  @db.Text
  points      Int      @default(1)
  order       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers     QuizAnswer[]
  responses   QuizResponse[]
}
```

**QuizAnswer**

```prisma
model QuizAnswer {
  id          String   @id @default(cuid())
  questionId  String
  answer      String   @db.Text
  isCorrect   Boolean  @default(false)
  order       Int
  createdAt   DateTime @default(now())

  // Relations
  question    QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

**QuizAttempt**

```prisma
model QuizAttempt {
  id            String   @id @default(cuid())
  quizId        String
  userId        String
  attemptNumber Int
  status        AttemptStatus // IN_PROGRESS, SUBMITTED, GRADED
  score         Float?
  maxScore      Float?
  percentage    Float?
  startedAt     DateTime @default(now())
  submittedAt   DateTime?
  gradedAt      DateTime?

  // Relations
  quiz          Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  responses     QuizResponse[]

  @@unique([quizId, userId, attemptNumber])
}
```

**QuizResponse**

```prisma
model QuizResponse {
  id          String   @id @default(cuid())
  attemptId   String
  questionId  String
  answer      String?  @db.Text
  isCorrect   Boolean? // null = pending manual grading
  points      Float?
  createdAt   DateTime @default(now())

  // Relations
  attempt     QuizAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question    QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

#### **Enrollment & Progress**

**CourseEnrollment**

```prisma
model CourseEnrollment {
  id           String   @id @default(cuid())
  courseId     String
  userId       String
  enrolledAt   DateTime @default(now())
  completedAt  DateTime?
  status       String   @default("active")

  // Relations
  course       Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
}
```

**LessonProgress**

```prisma
model LessonProgress {
  id           String   @id @default(cuid())
  lessonId     String
  userId       String
  completed    Boolean  @default(false)
  completedAt  DateTime?
  lastAccessed DateTime @default(now())

  // Relations
  lesson       Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([lessonId, userId])
}
```

#### **System Models**

**AuditLog**

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     AuditAction // Enum of actions
  entityType String
  entityId   String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  // Relations
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Enums

```prisma
enum UserRole {
  ADMIN
  LECTURER
  STUDENT
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
  PENDING
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum LessonType {
  VIDEO
  READING
  QUIZ
  ASSIGNMENT
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  LONG_ANSWER
}

enum ResourceType {
  FILE
  EXTERNAL_LINK
  EMBEDDED
  TEXT_NOTE
}

enum AssetVisibility {
  PUBLIC
  SCHEDULED
  HIDDEN
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  GRADED
}

enum AuditAction {
  USER_LOGIN
  USER_LOGOUT
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  // ... 20+ more actions
}
```

### Relationships Diagram

```
User (1) ──────────── (*) Course
  │                      │
  │                      └── (*) Module
  │                           │
  │                           └── (*) Lesson
  │                                │
  │                                ├── (*) LessonResource
  │                                │    └── (*) ResourceVersion
  │                                │
  │                                ├── (0..1) Quiz
  │                                │    │
  │                                │    └── (*) QuizQuestion
  │                                │         └── (*) QuizAnswer
  │                                │
  │                                └── (*) Submission
  │
  ├── (*) CourseEnrollment ────── Course
  ├── (*) LessonProgress ────────── Lesson
  ├── (*) QuizAttempt ──────────── Quiz
  │    └── (*) QuizResponse ────── QuizQuestion
  │
  └── (*) AuditLog
```

---

## 📡 API Reference

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://lms.cca.it.com/api`

### Authentication

All API routes require authentication via NextAuth session cookie, except:

- POST `/api/auth/callback/credentials` (login)
- POST `/api/auth/request-reset` (password reset)

**Authorization Header**: Not required (uses HTTP-only cookies)

### Response Format

**Success:**

```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error:**

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Admin Endpoints

All admin endpoints require `role: ADMIN or LECTURER`

#### **Programmes**

**GET** `/api/admin/programmes`
List all programmes

Query Parameters:

- `status`: Filter by status (DRAFT, PUBLISHED, ARCHIVED)
- `lecturerId`: Filter by lecturer

Response:

```json
{
  "programmes": [
    {
      "id": "clx...",
      "title": "Web Development Bootcamp",
      "status": "PUBLISHED",
      "lecturerId": "clx...",
      "_count": {
        "modules": 5,
        "enrollments": 23
      }
    }
  ]
}
```

**POST** `/api/admin/programmes`
Create programme

Request:

```json
{
  "title": "Web Development Bootcamp",
  "description": "Learn HTML, CSS, JavaScript, React",
  "status": "DRAFT",
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-06-01T00:00:00Z",
  "enrollmentLimit": 30
}
```

**PUT** `/api/admin/programmes/[id]`
Update programme

**DELETE** `/api/admin/programmes/[id]`
Delete programme (cascades to modules, lessons, resources, quizzes)

---

#### **Modules**

**POST** `/api/admin/modules`
Create module

Request:

```json
{
  "courseId": "clx...",
  "title": "Introduction to HTML",
  "description": "Learn HTML basics and structure",
  "order": 0
}
```

**PUT** `/api/admin/modules/[id]`
Update module

**DELETE** `/api/admin/modules/[id]`
Delete module

**POST** `/api/admin/modules/reorder`
Reorder modules (drag-and-drop)

Request:

```json
{
  "updates": [
    { "id": "clx1...", "order": 0 },
    { "id": "clx2...", "order": 1 },
    { "id": "clx3...", "order": 2 }
  ]
}
```

---

#### **Lessons**

**POST** `/api/admin/lessons`
Create lesson

Request:

```json
{
  "moduleId": "clx...",
  "title": "HTML Basics",
  "description": "Learn HTML elements and attributes",
  "type": "VIDEO",
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "content": "# Lesson Content\n\nMarkdown supported...",
  "duration": 30,
  "order": 0,
  "isPublished": true
}
```

**PUT** `/api/admin/lessons/[id]`
Update lesson

**DELETE** `/api/admin/lessons/[id]`
Delete lesson

**POST** `/api/admin/lessons/reorder`
Reorder lessons

---

#### **Quizzes**

**POST** `/api/admin/quizzes`
Create quiz with questions

Request:

```json
{
  "lessonId": "clx...",
  "title": "HTML Quiz",
  "description": "Test your HTML knowledge",
  "timeLimit": 30,
  "passingScore": 70,
  "maxAttempts": 3,
  "shuffleQuestions": false,
  "shuffleAnswers": true,
  "showResults": true,
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "What does HTML stand for?",
      "explanation": "HTML is the standard markup language for web pages",
      "points": 1,
      "answers": [
        {
          "answer": "HyperText Markup Language",
          "isCorrect": true,
          "order": 0
        },
        {
          "answer": "High Tech Modern Language",
          "isCorrect": false,
          "order": 1
        }
      ]
    },
    {
      "type": "TRUE_FALSE",
      "question": "HTML is a programming language",
      "points": 1,
      "answers": [
        { "answer": "True", "isCorrect": false, "order": 0 },
        { "answer": "False", "isCorrect": true, "order": 1 }
      ]
    },
    {
      "type": "SHORT_ANSWER",
      "question": "What is the purpose of the <head> tag?",
      "points": 2,
      "answers": []
    }
  ]
}
```

Response:

```json
{
  "quiz": {
    "id": "clx...",
    "title": "HTML Quiz",
    "questions": [...]
  }
}
```

**GET** `/api/admin/quizzes/[id]?includeQuestions=true`
Get quiz with questions

**PUT** `/api/admin/quizzes/[id]`
Update quiz

**DELETE** `/api/admin/quizzes/[id]`
Delete quiz

---

#### **Resources**

**POST** `/api/admin/resources`
Upload resource (multipart/form-data)

Request (FormData):

```javascript
const formData = new FormData();
formData.append("file", fileBlob); // For type=FILE
formData.append("lessonId", "clx...");
formData.append("title", "Course Slides");
formData.append("description", "Week 1 slides");
formData.append("type", "FILE"); // FILE, EXTERNAL_LINK, EMBEDDED, TEXT_NOTE
formData.append("visibility", "PUBLIC"); // PUBLIC, SCHEDULED, HIDDEN
formData.append("downloadable", "true");
// For EXTERNAL_LINK:
// formData.append('externalUrl', 'https://example.com');
// For TEXT_NOTE:
// formData.append('textContent', 'Rich text content...');
```

Response:

```json
{
  "id": "clx...",
  "title": "Course Slides",
  "type": "FILE",
  "fileKey": "uploads/abc123.pdf",
  "fileName": "slides.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "signedUrl": "https://r2.cloudflarestorage.com/..."
}
```

**GET** `/api/admin/resources?lessonId=clx...`
List lesson resources

Response:

```json
[
  {
    "id": "clx...",
    "title": "Course Slides",
    "type": "FILE",
    "fileName": "slides.pdf",
    "fileSize": 2048576,
    "visibility": "PUBLIC",
    "downloadable": true,
    "signedUrl": "https://...", // 1 hour expiry
    "createdAt": "2026-01-23T12:00:00Z"
  }
]
```

**PUT** `/api/admin/resources/[id]`
Update resource metadata

Request (FormData):

```javascript
formData.append("title", "Updated Title");
formData.append("description", "Updated description");
formData.append("visibility", "HIDDEN");
formData.append("downloadable", "false");
```

**DELETE** `/api/admin/resources/[id]`
Delete resource (also deletes from R2 storage)

**POST** `/api/admin/resources/reorder`
Reorder resources (drag-and-drop)

Request:

```json
{
  "updates": [
    { "id": "clx1...", "order": 0 },
    { "id": "clx2...", "order": 1 }
  ]
}
```

---

#### **Users**

**GET** `/api/admin/users`
List all users

Query Parameters:

- `role`: Filter by role (ADMIN, LECTURER, STUDENT)
- `status`: Filter by status (ACTIVE, SUSPENDED, PENDING)

**POST** `/api/admin/users`
Create user

Request:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "STUDENT",
  "status": "ACTIVE"
}
```

**PUT** `/api/admin/users/[id]`
Update user

Request:

```json
{
  "name": "Jane Smith",
  "role": "LECTURER",
  "status": "SUSPENDED"
}
```

**DELETE** `/api/admin/users/[id]`
Delete user (soft delete, sets status to SUSPENDED)

---

### Student Endpoints

#### **Quizzes**

**GET** `/api/admin/quizzes/[id]?includeQuestions=true`
Get quiz details (students can access published quizzes)

**POST** `/api/quizzes/attempts`
Submit quiz attempt

Request:

```json
{
  "quizId": "clx...",
  "responses": [
    {
      "questionId": "clx1...",
      "answer": "HyperText Markup Language",
      "answerId": "clx_answer1..." // For MC/TF
    },
    {
      "questionId": "clx2...",
      "answer": "The <head> tag contains metadata about the HTML document" // For text answers
    }
  ]
}
```

Response:

```json
{
  "attempt": {
    "id": "clx...",
    "score": 8.5,
    "maxScore": 10,
    "percentage": 85,
    "passed": true,
    "status": "GRADED"
  },
  "responses": [
    {
      "questionId": "clx1...",
      "questionText": "What does HTML stand for?",
      "userAnswer": "HyperText Markup Language",
      "isCorrect": true,
      "points": 1
    },
    {
      "questionId": "clx2...",
      "questionText": "What is the purpose of the <head> tag?",
      "userAnswer": "The <head> tag contains metadata...",
      "isCorrect": null, // Pending manual grading
      "points": null
    }
  ]
}
```

---

### Error Codes

| Code | Description                          |
| ---- | ------------------------------------ |
| 400  | Bad Request - Invalid input          |
| 401  | Unauthorized - Not logged in         |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist   |
| 409  | Conflict - Duplicate entry           |
| 500  | Internal Server Error                |

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

Vercel provides the best experience for Next.js applications with:

- Edge Runtime support
- Automatic CI/CD from Git
- Preview deployments for PRs
- Zero-config setup

#### Prerequisites

1. GitHub/GitLab/Bitbucket repository
2. Vercel account (free tier available)
3. Database setup (Supabase recommended)
4. Cloudflare R2 bucket created
5. Resend API key (optional)

#### Step 1: Push to Git

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-org/cca-lms.git
git push -u origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com/new)
2. Click **"Import Project"**
3. Select your Git repository
4. Vercel auto-detects Next.js configuration
5. Click **"Deploy"** (will fail without env vars)

#### Step 3: Configure Environment Variables

⚠️ **CRITICAL**: Environment variables must be set for **ALL environments**

Go to: **Project Settings** → **Environment Variables**

For **EACH** variable:

1. Enter variable name and value
2. **Check ALL THREE**: ✅ Production ✅ Preview ✅ Development
3. Click **Save**

**Required Variables:**

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-base64-secret"
# ⚠️ DO NOT SET NEXTAUTH_URL - trustHost: true handles this

# R2 Storage
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="cca-lms-uploads"
R2_REGION="auto"

# Email
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# App
APP_NAME="CCA LMS"
```

#### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for build to complete

#### Step 5: Run Database Seed

Since Vercel deployments are stateless, run seed from local:

```bash
# Set DATABASE_URL to production database
DATABASE_URL="your-production-db-url" npm run db:seed
```

Or use Vercel CLI:

```bash
npm i -g vercel
vercel env pull .env.production
vercel exec -- npm run db:seed
```

#### Step 6: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain: `lms.yourdomain.com`
3. Update DNS records as instructed
4. SSL certificate auto-provisioned

---

### Vercel Configuration

**vercel.json** (optional, auto-detected):

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "regions": ["iad1"], // US East
  "env": {
    "NODE_ENV": "production"
  }
}
```

**next.config.ts** (already configured):

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: "5mb";
  }
}
```

---

### Troubleshooting Vercel Deployment

#### Issue: "Configuration" Error on Login

**Cause**: NEXTAUTH_URL is set in environment variables

**Fix**:

1. Delete `NEXTAUTH_URL` from Vercel env vars
2. Verify `trustHost: true` in `lib/auth.ts`
3. Redeploy

#### Issue: Database Connection Timeout

**Cause**: Using direct connection URL (port 5432) instead of pooler

**Fix**:

1. Use pooler URL with `?pgbouncer=true`
2. Set `DATABASE_URL` to port 6543
3. Redeploy

#### Issue: File Upload Fails

**Cause**: Missing R2 credentials or incorrect bucket

**Fix**:

1. Verify all R2 env vars are set for all environments
2. Check bucket name matches
3. Test R2 connection:

```bash
npm run dev
# Try uploading a file
```

#### Issue: Build Fails with Prisma Error

**Cause**: Database schema out of sync

**Fix**:

```bash
# Regenerate Prisma client
npm run db:generate
git add generated/
git commit -m "Update Prisma client"
git push
```

---

### Environment-Specific Settings

**Development** (.env.local):

```bash
DATABASE_URL="postgresql://localhost:5432/cca_lms_dev"
NEXTAUTH_SECRET="dev-secret-key"
```

**Preview** (Vercel auto-generated):

- Uses preview environment variables
- Separate preview database recommended
- Preview URL: `cca-lms-git-branch-user.vercel.app`

**Production** (Vercel environment):

- Production database
- Custom domain
- All features enabled

---

## 🔒 Security

### Authentication & Authorization

#### Password Security

- **Hashing**: bcrypt with 10 salt rounds
- **Requirements**: Min 8 characters (enforced client-side)
- **Storage**: Never stored in plain text
- **Reset**: Time-limited tokens with email verification

#### Session Management

- **Strategy**: JWT with secure HTTP-only cookies
- **Expiry**: 30 days (configurable)
- **Refresh**: Auto-refreshes on activity
- **Logout**: Clears cookies and invalidates session

#### Role-Based Access Control (RBAC)

- **3 Roles**: ADMIN, LECTURER, STUDENT
- **Middleware**: Validates role on protected routes
- **API**: Role checks in all admin endpoints
- **UI**: Conditional rendering based on role

### Row-Level Security (RLS)

PostgreSQL RLS policies isolate data by role:

#### Admin Policies

```sql
-- Admins can see all data
CREATE POLICY "admin_all" ON "Course"
  FOR ALL
  USING (current_user_role() = 'ADMIN');
```

#### Lecturer Policies

```sql
-- Lecturers see own courses
CREATE POLICY "lecturer_own_courses" ON "Course"
  FOR ALL
  USING ("lecturerId" = current_user_id());

-- Lecturers see enrolled students
CREATE POLICY "lecturer_view_students" ON "CourseEnrollment"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Course"
      WHERE id = "CourseEnrollment"."courseId"
      AND "lecturerId" = current_user_id()
    )
  );
```

#### Student Policies

```sql
-- Students see published courses
CREATE POLICY "student_published_courses" ON "Course"
  FOR SELECT
  USING (status = 'PUBLISHED');

-- Students see own enrollments
CREATE POLICY "student_own_enrollments" ON "CourseEnrollment"
  FOR SELECT
  USING ("userId" = current_user_id());

-- Students see own quiz attempts
CREATE POLICY "student_own_attempts" ON "QuizAttempt"
  FOR ALL
  USING ("userId" = current_user_id());
```

**All 21 tables have RLS enabled** with appropriate policies.

### File Upload Security

#### Validation

- **Type Check**: Whitelist of allowed MIME types
- **Size Limit**: 500MB max per file
- **Virus Scan**: (TODO: Integrate ClamAV)

#### Storage

- **Cloudflare R2**: S3-compatible object storage
- **Signed URLs**: 1-hour expiry for downloads
- **Private Bucket**: No public access
- **Encryption**: At-rest and in-transit

#### Access Control

- Students: Can only download PUBLIC or own resources
- Lecturers: Can manage resources for own courses
- Admins: Full access

### Audit Logging

All sensitive actions are logged:

```typescript
await createAuditLog({
  userId: session.user.id,
  action: "USER_CREATED",
  entityType: "User",
  entityId: newUser.id,
  metadata: {
    email: newUser.email,
    role: newUser.role,
  },
});
```

**Logged Actions:**

- User login/logout
- User CRUD operations
- Course/Module/Lesson changes
- Quiz attempts and submissions
- Resource uploads/downloads
- Permission changes

### SQL Injection Prevention

**Prisma ORM** uses parameterized queries:

```typescript
// ✅ SAFE - Parameterized
await prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ UNSAFE - Raw SQL (never do this)
await prisma.$executeRawUnsafe(
  `SELECT * FROM User WHERE email = '${userInput}'`,
);
```

### XSS Protection

**React** auto-escapes all user input:

```tsx
// ✅ SAFE - Automatically escaped
<div>{userInput}</div>

// ⚠️ DANGEROUS - Only use with trusted content
<div dangerouslySetInnerHTML={{ __html: trustedHtml }} />
```

### CSRF Protection

Next.js automatically includes CSRF tokens in:

- Server Actions
- API Routes with cookies
- Form submissions

### Best Practices Implemented

- ✅ No sensitive data in client components
- ✅ Server-side validation for all inputs
- ✅ Zod schemas for runtime type checking
- ✅ Environment variables never exposed to client
- ✅ HTTPS enforced in production
- ✅ Secure cookies (HttpOnly, SameSite, Secure)
- ✅ Rate limiting (TODO: Implement Upstash)
- ✅ Error messages don't leak sensitive info

---

## 👨‍💻 Development

### Development Workflow

```bash
# Start development server
npm run dev
# Open http://localhost:3000

# Run in another terminal:
npm run db:studio
# Open http://localhost:5555 (Prisma Studio)
```

### Code Style

**ESLint** configuration:

```bash
npm run lint
```

**Prettier** (if installed):

```bash
npx prettier --write .
```

### Database Operations

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Reset database (⚠️ deletes all data)
prisma migrate reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Adding a New Feature

**Example: Add "Course Rating" feature**

#### 1. Update Prisma Schema

```prisma
// prisma/schema.prisma

model CourseRating {
  id        String   @id @default(cuid())
  courseId  String
  userId    String
  rating    Int      @db.SmallInt // 1-5 stars
  comment   String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
  @@index([courseId])
}

model Course {
  // ... existing fields
  ratings   CourseRating[]
}

model User {
  // ... existing fields
  ratings   CourseRating[]
}
```

#### 2. Push Schema

```bash
npm run db:generate
npm run db:push
```

#### 3. Update RLS

Add to `prisma/migrations/enable_rls.sql`:

```sql
ALTER TABLE "CourseRating" ENABLE ROW LEVEL SECURITY;

-- Students can create/update own ratings
CREATE POLICY "rating_own" ON "CourseRating"
  FOR ALL
  USING ("userId" = current_user_id());

-- Everyone can view published course ratings
CREATE POLICY "rating_view_published" ON "CourseRating"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Course"
      WHERE id = "CourseRating"."courseId"
      AND status = 'PUBLISHED'
    )
  );
```

Re-run seed:

```bash
npm run db:seed
```

#### 4. Create API Route

```typescript
// app/api/courses/[id]/ratings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;

  const body = await request.json();
  const validation = ratingSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error },
      { status: 400 },
    );
  }

  const { rating, comment } = validation.data;

  const courseRating = await prisma.courseRating.upsert({
    where: {
      courseId_userId: {
        courseId,
        userId: session.user.id,
      },
    },
    update: { rating, comment },
    create: {
      courseId,
      userId: session.user.id,
      rating,
      comment,
    },
  });

  return NextResponse.json(courseRating);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: courseId } = await params;

  const ratings = await prisma.courseRating.findMany({
    where: { courseId },
    include: {
      user: {
        select: { name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  return NextResponse.json({
    ratings,
    average,
    count: ratings.length,
  });
}
```

#### 5. Create UI Component

```tsx
// components/courses/course-rating.tsx

"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CourseRatingProps {
  courseId: string;
  initialRating?: number;
  initialComment?: string;
}

export function CourseRating({
  courseId,
  initialRating = 0,
  initialComment = "",
}: CourseRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) throw new Error("Failed to submit rating");

      toast.success("Rating submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit rating");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoverRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Write a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
}
```

#### 6. Test

```bash
# Start dev server
npm run dev

# Test API directly
curl -X POST http://localhost:3000/api/courses/clx.../ratings \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Great course!"}'

# Test in browser
# Login as student → View course → Submit rating
```

### Testing (TODO)

```bash
# Unit tests (Jest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Type checking
npx tsc --noEmit
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error:**

```
PrismaClientInitializationError: Can't reach database server
```

**Solutions:**

- Verify `DATABASE_URL` is correct
- Check database is running
- For Supabase: Use pooler URL (port 6543) not direct connection
- URL-encode special characters in password

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

#### 2. Prisma Generate Fails

**Error:**

```
Prisma schema validation failed
```

**Solutions:**

- Check `schema.prisma` syntax
- Verify all relations are correct
- Run `npx prisma validate`

```bash
npm run db:generate -- --schema=./prisma/schema.prisma
```

#### 3. NextAuth Configuration Error

**Error:**

```
[auth][error] Configuration: Please define a secret
```

**Solutions:**

- Set `NEXTAUTH_SECRET` in `.env`
- Do NOT set `NEXTAUTH_URL` (conflicts with `trustHost: true`)
- Regenerate secret: `openssl rand -base64 32`

#### 4. File Upload 500 Error

**Error:**

```
Failed to upload resource
```

**Solutions:**

- Verify R2 credentials are correct
- Check bucket exists
- Verify file size < 500MB
- Check R2 account is active

```bash
# Test R2 connection
npm run dev
# Check logs for detailed error
```

#### 5. Build Fails on Vercel

**Error:**

```
Module not found: Can't resolve '@/generated/prisma'
```

**Solutions:**

- Commit `generated/` folder to Git
- Run `npm run db:generate` before build
- Check `.gitignore` doesn't exclude generated files

```bash
# Remove from .gitignore if present
# /generated
git add generated/
git commit -m "Add Prisma generated client"
git push
```

#### 6. Login Works Locally, Fails in Production

**Cause:**

- NEXTAUTH_URL set to localhost
- Cookie domain mismatch
- Database not accessible from Vercel

**Fix:**

- Remove NEXTAUTH_URL from Vercel env vars
- Use `trustHost: true` in auth config
- Verify DATABASE_URL points to public database

#### 7. RLS Blocks Admin Actions

**Error:**

```
Insufficient privileges
```

**Solutions:**

- Check user role is ADMIN
- Verify RLS policies include admin exceptions
- Re-run seed: `npm run db:seed`

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View policies
SELECT * FROM pg_policies;
```

### Getting Help

1. **Check Logs:**

   ```bash
   # Development
   npm run dev
   # Check terminal output

   # Production (Vercel)
   vercel logs
   ```

2. **Enable Debug Mode:**

   ```bash
   # In .env
   DEBUG=prisma:query,prisma:info,prisma:warn
   NEXTAUTH_DEBUG=true
   ```

3. **Database Studio:**

   ```bash
   npm run db:studio
   # Inspect data directly
   ```

4. **Community:**
   - [Next.js Discussions](https://github.com/vercel/next.js/discussions)
   - [Prisma Discord](https://pris.ly/discord)
   - [NextAuth Discussions](https://github.com/nextauthjs/next-auth/discussions)

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Codezela Career Accelerator

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Prisma Team** - For type-safe database access
- **Vercel** - For seamless deployment
- **Supabase** - For PostgreSQL hosting
- **Cloudflare** - For R2 storage
- **Radix UI** - For accessible components
- **Shadcn** - For UI component patterns

---

## 📞 Contact

- **Website**: [https://lms.cca.it.com](https://lms.cca.it.com)
- **Email**: support@codezela.com
- **GitHub**: [@your-org](https://github.com/your-org/cca-lms)

---

<div align="center">

**Built with ❤️ by Codezela**

⭐ Star this repo if you find it useful!

</div>
