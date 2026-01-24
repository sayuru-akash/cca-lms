# 🎓 Codezela Career Accelerator - LMS

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.19.2-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-316192?style=for-the-badge&logo=postgresql)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)

**Production-Ready Learning Management System by Codezela Technologies**

_Developed with ❤️ by [Codezela Technologies](https://codezela.com)_

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
  - [Content Management](#-content-management)
  - [User Roles](#-user-roles)
  - [Assessment System](#-assessment-system)
  - [Resource Library](#-resource-library)
  - [Security & Compliance](#-security--compliance)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Best Practices](#-best-practices)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Codezela Career Accelerator LMS** is a comprehensive, enterprise-grade Learning Management System designed for modern educational institutions, corporate training programs, and online academies. Built with cutting-edge technologies and featuring a sleek terminal-inspired aesthetic, it delivers a complete end-to-end learning experience.

### Why Choose CCA LMS?

✅ **Production-Ready** - Battle-tested with real users, zero downtime deployments  
✅ **Type-Safe** - 100% TypeScript with Prisma-generated types  
✅ **Secure by Design** - Row-Level Security, audit logging, NextAuth v5  
✅ **Performance Optimized** - Turbopack bundling, React Server Components, edge runtime  
✅ **Fully Featured** - Quiz system, multi-format resources, bulk enrollment, analytics  
✅ **Responsive Design** - Mobile-first UI that works on all devices  
✅ **SEO Protected** - robots.txt and meta tags configured for privacy  
✅ **Google Analytics** - Built-in tracking and insights

### What Makes It Unique?

- **Terminal Aesthetic** - Dark green on black theme inspired by classic terminals
- **Intelligent Content Rendering** - Automatically detects and embeds YouTube, Vimeo videos
- **Admin-Controlled Enrollment** - No self-service enrollment, full admin control
- **Bulk CSV Enrollment** - Upload hundreds of students instantly
- **Real-time Progress Tracking** - Live lesson completion and quiz scores
- **Multi-Format Resources** - Videos, PDFs, links, embedded content, rich text notes

---

## ✨ Features

### 📚 Content Management

#### **Programme Structure**

- **Three-Tier Hierarchy**: Programmes → Modules → Lessons
- **Drag-and-Drop Reordering**: Intuitive content organization
- **Status Management**: Draft, Published, Archived states
- **Visibility Controls**: Schedule content release dates
- **Enrollment Tracking**: Real-time capacity monitoring
- **Bulk Operations**: Mass student enrollment via CSV

#### **Lesson Types**

The system supports diverse lesson formats:

1. **Video Lessons**
   - Direct video file uploads to Cloudflare R2
   - **YouTube Integration** - Automatic embed detection
   - **Vimeo Integration** - Native player embedding
   - HTML5 video player with progress tracking
   - Auto-mark complete on video end

2. **Rich Text Content**
   - Full HTML support with custom styling
   - Code syntax highlighting
   - Tables, lists, blockquotes
   - Image embedding
   - Terminal-themed typography

3. **Interactive Quizzes**
   - Multiple choice questions
   - True/False questions
   - Short answer (manual grading)
   - Essay questions (manual grading)

4. **Resource-Based Lessons**
   - Multiple attachments per lesson
   - Mix and match content types
   - Scheduled availability

### 👥 User Roles

#### **🔑 Administrator**

**Full System Control:**

- User Management
  - Create, edit, delete users (students, lecturers, admins)
  - Bulk CSV enrollment with validation
  - Download enrollment templates
  - Account status management (Active, Suspended, Deleted)
  - Password reset capabilities
- Programme Management
  - Create/edit/delete programmes
  - Module and lesson organization
  - Content visibility controls
  - Enrollment capacity settings
- Analytics Dashboard
  - Total users, programmes, enrollments
  - Recent activity logs
  - System-wide statistics
  - 20+ action types tracked
- Audit Logging
  - Every user action logged with metadata
  - IP address and user agent tracking
  - Timestamps and entity references
  - Filterable audit trail

#### **👨‍🏫 Lecturer**

**Content Creation & Student Management:**

- Programme Development
  - Create and publish programmes
  - Build multi-module courses
  - Upload video content
  - Add lesson resources
- Quiz Management
  - Visual quiz builder (673 lines of code)
  - 4 question types supported
  - Automatic and manual grading
  - Result analytics
- Student Oversight
  - View enrolled students
  - Track individual progress
  - Grade text-based submissions
  - Generate progress reports
- Resource Library
  - Upload files (20MB limit)
  - Create rich text notes
  - Add external links
  - Embed videos/iframes

#### **🎓 Student**

**Learning Experience:**

- Programme Access
  - View assigned programmes only (admin-controlled)
  - No self-enrollment capability
  - Progress tracking dashboard
  - Recently accessed lessons
- Lesson Interaction
  - Watch videos (YouTube/Vimeo/direct)
  - Read text content
  - Download resources
  - Mark lessons complete
- Quiz Taking
  - Timed quiz attempts
  - Question navigation
  - Save and resume support
  - Instant score feedback
- Progress Monitoring
  - Completion percentages
  - Quiz scores and attempts
  - Learning activity history
  - Achievement tracking

### 🎯 Assessment System

#### **Quiz Builder (Lecturer/Admin)**

Comprehensive quiz creation tool with:

**Question Types:**

1. **Multiple Choice**
   - Single correct answer
   - Radio button interface
   - Up to 10 answer options
   - Point value configuration
   - Explanation field for feedback

2. **True/False**
   - Binary questions
   - Toggle-based selection
   - Quick grading
   - Explanation support

3. **Short Answer**
   - Text input field
   - Manual grading required
   - 20 character limit
   - Rubric support

4. **Essay Questions**
   - Long-form responses
   - Rich text area
   - Manual grading workflow
   - Detailed feedback options

**Quiz Settings:**

- **Time Limit**: Set duration in minutes (0 = unlimited)
- **Passing Score**: Define threshold percentage
- **Attempts**: Limit number of tries
- **Question Shuffling**: Randomize question order
- **Answer Shuffling**: Randomize answer order (MC only)
- **Show Correct Answers**: Display after submission
- **Immediate Results**: Show score instantly

**Grading Features:**

- Auto-grading for MC and T/F (instant results)
- Manual grading interface for text responses
- Partial credit support
- Bulk grading capabilities
- Score analytics and statistics

#### **Quiz Player (Student)**

Optimized quiz-taking experience:

- **Visual Timer**: Countdown with color-coded alerts
- **Progress Tracker**: Question completion indicator
- **Smart Navigation**: Jump to any question
- **Auto-Save**: Progress saved every 30 seconds
- **Visual Feedback**: Answered vs unanswered highlighting
- **Results Display**:
  - Total score and percentage
  - Pass/Fail indicator
  - Question-by-question breakdown
  - Correct answer reveal (if enabled)
  - Explanation display

### 📁 Resource Library

#### **Supported Resource Types**

1. **FILE Upload** (Cloudflare R2)
   - **Supported Formats**: PDF, DOCX, XLSX, PPT, images, videos, archives
   - **File Size Limit**: 20MB per file
   - **Drag & Drop**: Modern upload interface with progress bars
   - **Signed URLs**: Secure downloads with 1-hour expiry
   - **Version Control**: Complete upload history
   - **Metadata**: Filename, MIME type, file size tracking

2. **EXTERNAL_LINK**
   - Link to any web resource
   - Documentation sites
   - Online articles
   - Reference materials
   - Opens in new tab

3. **EMBEDDED Content**
   - YouTube videos (auto-detection)
   - Vimeo videos (auto-detection)
   - Custom iframe embeds
   - Interactive content (CodePen, JSFiddle)
   - Google Forms/Slides
   - Aspect-ratio responsive containers

4. **TEXT_NOTE**
   - Rich HTML content
   - Custom terminal-themed prose styling
   - Syntax-highlighted code blocks
   - Markdown-style formatting
   - Tables and lists
   - Embedded images

#### **Resource Management Features**

- **Drag-and-Drop Reordering**: Change resource sequence
- **Visibility Controls**:
  - PUBLIC: Visible to all enrolled students
  - SCHEDULED: Visible after specific date/time
  - HIDDEN: Accessible only to lecturers/admins
- **Downloadable Toggle**: Enable/disable download button
- **Edit Metadata**: Update title, description, visibility
- **Version History**: Track all resource changes
- **Bulk Actions**: Delete multiple resources
- **Preview Support**: View before publishing

### 🔐 Security & Compliance

#### **Authentication & Authorization**

- **NextAuth v5**: Industry-standard authentication
- **JWT Tokens**: Secure session management (30-day expiry)
- **bcrypt Hashing**: Password security with 12 salt rounds
- **HTTP-Only Cookies**: XSS attack prevention
- **CSRF Protection**: Built-in Next.js security
- **Role-Based Access**: Enforced at API and UI levels

#### **Database Security**

- **Row-Level Security (RLS)**: PostgreSQL policies on all 15 tables
- **Prepared Statements**: Prisma prevents SQL injection
- **Connection Pooling**: Optimized database connections
- **Encrypted Connections**: SSL/TLS for all database traffic
- **Automatic Backups**: Daily Supabase snapshots

#### **File Security**

- **Type Validation**: MIME type checking
- **Size Limits**: 20MB hard cap
- **Virus Scanning**: Cloudflare security features
- **Signed URLs**: Expiring download links (1 hour)
- **Access Control**: File access tied to enrollment

#### **Audit Logging**

Every action tracked with:

- User ID and role
- Action type (20+ types)
- Entity type and ID
- Metadata (JSON)
- IP address
- User agent
- Timestamp

**Tracked Actions:**

- USER_CREATED, USER_UPDATED, USER_DELETED
- PROGRAMME_CREATED, PROGRAMME_UPDATED, PROGRAMME_DELETED
- MODULE_CREATED, MODULE_UPDATED, MODULE_DELETED, MODULE_REORDERED
- LESSON_CREATED, LESSON_UPDATED, LESSON_DELETED, LESSON_REORDERED
- QUIZ_CREATED, QUIZ_UPDATED, QUIZ_DELETED
- RESOURCE_UPLOADED, RESOURCE_UPDATED, RESOURCE_DELETED
- ENROLLMENT_CREATED, ENROLLMENT_DELETED
- BULK_ENROLLMENT_STARTED, BULK_ENROLLMENT_COMPLETED

#### **SEO & Privacy**

- **robots.txt**: Blocks all search engines (Google, Bing, DuckDuckGo)
- **Meta Tags**: noindex, nofollow on all pages
- **Open Graph**: Disabled for privacy
- **Google Analytics**: G-S1F397DHHS (configurable)
- **No Public Indexing**: LMS content stays private

### 📊 Analytics & Reporting

#### **Admin Dashboard**

- Total registered users (by role)
- Active programmes and enrollments
- System activity timeline
- Storage usage statistics
- Quiz completion rates

#### **Lecturer Dashboard**

- My programmes overview
- Student enrollment counts
- Lesson completion rates
- Quiz score averages
- Recent student activity

#### **Student Dashboard**

- Enrolled programmes (admin-assigned only)
- Progress percentages
- Recently accessed lessons
- Upcoming quizzes
- Completed assessments

---

## 🛠 Tech Stack

### **Core Framework**

| Technology     | Version | Purpose                              |
| -------------- | ------- | ------------------------------------ |
| **Next.js**    | 16.1.4  | React framework with App Router      |
| **React**      | 19.0.2  | UI library with Server Components    |
| **TypeScript** | 5.7     | Type safety across the entire stack  |
| **Turbopack**  | Latest  | Fast development bundler (3x faster) |

### **Backend & Database**

| Technology      | Version       | Purpose                                 |
| --------------- | ------------- | --------------------------------------- |
| **PostgreSQL**  | 14+           | Primary relational database             |
| **Prisma**      | 6.19.2        | Type-safe ORM with migration management |
| **NextAuth.js** | 5.0.0-beta.30 | Authentication and session management   |
| **bcryptjs**    | 3.0.3         | Password hashing with salt rounds       |
| **Zod**         | 4.3.6         | Runtime schema validation               |
| **Nanoid**      | 5.1.6         | Unique ID generation (CUID alternative) |

### **Cloud Services**

| Service              | Purpose                                   |
| -------------------- | ----------------------------------------- |
| **Vercel**           | Edge runtime hosting with instant deploys |
| **Supabase**         | PostgreSQL database with RLS and backups  |
| **Cloudflare R2**    | S3-compatible object storage for files    |
| **Resend**           | Transactional email delivery (optional)   |
| **Google Analytics** | User behavior tracking and insights       |

### **UI & Styling**

| Technology         | Version | Purpose                              |
| ------------------ | ------- | ------------------------------------ |
| **Tailwind CSS**   | 4.0     | Utility-first CSS framework          |
| **Radix UI**       | Latest  | Accessible component primitives      |
| **Lucide React**   | 0.562.0 | Beautiful icon library (1000+ icons) |
| **next-themes**    | 0.4.6   | Dark/Light mode with system detect   |
| **Sonner**         | 2.0.7   | Toast notifications                  |
| **react-dropzone** | 14.3.8  | File upload with drag-and-drop       |
| **date-fns**       | 4.1.0   | Date manipulation and formatting     |
| **tw-animate-css** | 1.4.0   | Tailwind animation utilities         |

### **Development Tools**

| Tool              | Purpose                          |
| ----------------- | -------------------------------- |
| **ESLint**        | Code linting and consistency     |
| **TypeScript**    | Static type checking             |
| **tsx**           | TypeScript execution for scripts |
| **Prisma Studio** | Visual database browser          |
| **Git**           | Version control                  |

---

## 🏗 Architecture

### **System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router (React 19 Server Components)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Admin UI   │  │ Lecturer UI  │  │  Student UI  │         │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │         │
│  │  Users       │  │  Programmes  │  │  Programmes  │         │
│  │  Programmes  │  │  Quizzes     │  │  Lessons     │         │
│  │  Analytics   │  │  Resources   │  │  Quizzes     │         │
│  │  Audit Logs  │  │  Students    │  │  Progress    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (Edge Runtime)                             │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   /api/admin    │  │   /api/student  │                     │
│  │   /api/lecturer │  │   /api/auth     │                     │
│  └─────────────────┘  └─────────────────┘                     │
│                                                                 │
│  Middleware Layer                                              │
│  ┌─────────────────────────────────────────┐                  │
│  │  • Authentication (NextAuth)            │                  │
│  │  • Authorization (Role-based)           │                  │
│  │  • Request Validation (Zod)             │                  │
│  │  • Error Handling                       │                  │
│  │  • Audit Logging                        │                  │
│  └─────────────────────────────────────────┘                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma Client
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase) - 15 Models                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Users      │  │  Programmes  │  │    Quizzes   │         │
│  │   Sessions   │  │   Modules    │  │   Questions  │         │
│  │   Accounts   │  │   Lessons    │  │   Attempts   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Resources   │  │ Enrollments  │  │  Audit Logs  │         │
│  │  Versions    │  │   Progress   │  │ Notifications│         │
│  │  Files       │  │  Submissions │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  Row-Level Security (RLS) Policies                             │
│  ┌──────────────────────────────────────────────┐             │
│  │  • User-based access control                 │             │
│  │  • Role-based data filtering                 │             │
│  │  • Automatic policy enforcement              │             │
│  └──────────────────────────────────────────────┘             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Cloudflare R2   │  │     Resend       │                    │
│  │  (File Storage)  │  │   (Email API)    │                    │
│  │  • Videos        │  │  • Password Reset│                    │
│  │  • Documents     │  │  • Notifications │                    │
│  │  • Images        │  │  • Invitations   │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │ Google Analytics │                                          │
│  │  (G-S1F397DHHS)  │                                          │
│  │  • Page views    │                                          │
│  │  • User behavior │                                          │
│  │  • Conversions   │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

### **Authentication Flow**

```
User Login
    │
    ↓
┌─────────────────────────┐
│  Submit Email/Password  │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│ POST /api/auth/callback/credentials │
└───────────┬─────────────────────────┘
            │
            ↓
┌──────────────────────────┐
│  NextAuth Validate       │
│  • Email exists?         │
│  • Status = ACTIVE?      │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────┐
│  bcrypt.compare()        │
│  Password Hash Match?    │
└───────────┬──────────────┘
            │
            ↓ (Success)
┌──────────────────────────┐
│  Generate JWT Token      │
│  • user.id               │
│  • user.email            │
│  • user.role             │
│  • 30 day expiration     │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────┐
│  Set HTTP-Only Cookie    │
│  • Secure flag           │
│  • SameSite: Lax         │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────┐
│  Redirect to Dashboard   │
│  • /dashboard (admin)    │
│  • /dashboard (lecturer) │
│  • /dashboard (student)  │
└──────────────────────────┘

Subsequent Requests:
    │
    ↓
┌──────────────────────────┐
│  Middleware validates    │
│  JWT from cookie         │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────┐
│  auth() in Server        │
│  Components returns      │
│  session object          │
└──────────────────────────┘
```

### **Data Flow: Student Taking Quiz**

```
Student clicks "Start Quiz"
    │
    ↓
POST /api/quizzes/attempts
    │
    ├─ Verify enrollment
    ├─ Check attempt limit
    ├─ Create QuizAttempt (status: IN_PROGRESS)
    └─ Return attempt ID
    │
    ↓
Quiz Player Component Renders
    │
    ├─ Load questions (shuffled if enabled)
    ├─ Start countdown timer
    └─ Auto-save every 30 seconds
    │
    ↓
Student answers questions
    │
    └─ Store answers in state (not yet saved)
    │
    ↓
Student clicks "Submit Quiz"
    │
    ↓
POST /api/quizzes/attempts/[id]/submit
    │
    ├─ Verify time limit
    ├─ Create QuizResponse records
    ├─ Auto-grade MC and T/F questions
    ├─ Calculate total score
    ├─ Update attempt status to COMPLETED
    ├─ Check passing threshold
    ├─ Update lesson progress
    └─ Create audit log entry
    │
    ↓
Display Results
    │
    ├─ Total score and percentage
    ├─ Pass/Fail status
    ├─ Question-by-question breakdown
    └─ Correct answers (if enabled)
```

### **File Upload Flow**

```
User drags file to dropzone
    │
    ↓
Client-side validation
    │
    ├─ Check file size (< 20MB)
    ├─ Check file type (MIME)
    └─ Generate preview
    │
    ↓
POST /api/admin/resources
    │
    └─ Body: multipart/form-data
    │
    ↓
Server-side processing
    │
    ├─ Validate session & role
    ├─ Validate lesson exists
    ├─ Parse form data
    └─ Validate file again
    │
    ↓
Upload to Cloudflare R2
    │
    ├─ Generate unique file key
    ├─ Set content type
    ├─ Upload with AWS S3 SDK
    └─ Get file metadata
    │
    ↓
Save to database
    │
    ├─ Create LessonResource record
    ├─ Create ResourceVersion record
    ├─ Link to lesson
    └─ Set order number
    │
    ↓
Create audit log
    │
    └─ RESOURCE_UPLOADED action
    │
    ↓
Return success
    │
    └─ Client updates UI
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **PostgreSQL**: 14.x or higher, OR a [Supabase](https://supabase.com) account (recommended)
- **Cloudflare Account**: For R2 storage ([Sign up](https://cloudflare.com))
- **Resend Account**: For email functionality ([Sign up](https://resend.com)) - Optional

### Installation

#### **Step 1: Clone the Repository**

```bash
git clone https://github.com/codezela/cca-lms.git
cd cca-lms
```

#### **Step 2: Install Dependencies**

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and UI libraries.

#### **Step 3: Environment Setup**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database (Supabase or local PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 (File Storage)
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-key"
CLOUDFLARE_R2_BUCKET_NAME="your-bucket-name"
CLOUDFLARE_R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"

# Resend (Email - Optional)
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID="G-S1F397DHHS"
```

**Generate NextAuth Secret:**

```bash
openssl rand -base64 32
```

#### **Step 4: Database Setup**

**Option A: Using Supabase (Recommended)**

1. Create a new project at [Supabase](https://supabase.com)
2. Get your connection string from Project Settings → Database
3. Use the pooler URL for `DATABASE_URL` (for serverless)
4. Use the direct URL for `DIRECT_DATABASE_URL` (for migrations)

**Option B: Local PostgreSQL**

```bash
# Create database
createdb cca_lms

# Update .env with connection string
DATABASE_URL="postgresql://localhost:5432/cca_lms"
DIRECT_DATABASE_URL="postgresql://localhost:5432/cca_lms"
```

**Generate Prisma Client:**

```bash
npm run db:generate
```

**Run Database Migrations:**

```bash
npm run db:push
```

**Enable Row-Level Security:**

```bash
psql $DATABASE_URL < prisma/migrations/enable_rls.sql
```

**Seed Database with Initial Data:**

```bash
npm run db:seed
```

This creates:

- Admin user: `admin@codezela.com` / `Admin@123`
- Lecturer user: `lecturer@codezela.com` / `Lecturer@123`
- Student user: `student@codezela.com` / `Student@123`
- Sample programme with modules and lessons

#### **Step 5: Cloudflare R2 Setup**

1. Go to Cloudflare Dashboard → R2
2. Create a new bucket (e.g., `cca-lms-files`)
3. Generate API credentials (Access Key ID and Secret)
4. Configure CORS for your bucket:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Update `.env` with your R2 credentials

#### **Step 6: Start Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### **Verify Installation**

1. **Login as Admin:**
   - Email: `admin@codezela.com`
   - Password: `Admin@123`

2. **Check Features:**
   - Navigate to Users page
   - View Programmes
   - Check Analytics dashboard
   - Test file upload in Resources

3. **Login as Student:**
   - Email: `student@codezela.com`
   - Password: `Student@123`
   - View assigned programmes
   - Access a lesson

---

## 📁 Project Structure

```
cca-lms/
├── app/                                    # Next.js App Router
│   ├── api/                               # API Routes (Edge Runtime)
│   │   ├── admin/                         # Admin-only endpoints
│   │   │   ├── analytics/                # System analytics
│   │   │   ├── activity-logs/            # Audit log retrieval
│   │   │   ├── bulk-enroll/              # CSV bulk enrollment
│   │   │   │   ├── template/            # Download CSV template
│   │   │   │   ├── preview/             # Validate CSV preview
│   │   │   │   └── submit/              # Process enrollments
│   │   │   ├── dashboard-stats/          # Admin dashboard data
│   │   │   ├── lessons/                  # Lesson CRUD + reorder
│   │   │   ├── modules/                  # Module CRUD + reorder
│   │   │   ├── programmes/               # Programme CRUD
│   │   │   ├── quizzes/                  # Quiz CRUD
│   │   │   ├── resources/                # Resource CRUD + reorder
│   │   │   └── users/                    # User management CRUD
│   │   ├── auth/                         # Authentication
│   │   │   ├── [...nextauth]/           # NextAuth handlers
│   │   │   ├── change-password/         # Password update
│   │   │   ├── request-reset/           # Reset request
│   │   │   └── reset-password/          # Password reset
│   │   ├── lecturer/                     # Lecturer endpoints
│   │   │   ├── dashboard/               # Lecturer stats
│   │   │   ├── programmes/              # Own programmes
│   │   │   └── students/                # Enrolled students
│   │   ├── student/                      # Student endpoints
│   │   │   ├── dashboard/               # Student stats
│   │   │   ├── lessons/[id]/progress/   # Mark complete
│   │   │   ├── profile/                 # User profile
│   │   │   └── programmes/              # Enrolled programmes
│   │   │       ├── [id]/                # Programme details
│   │   │       ├── [id]/enroll/         # Self-enroll (disabled)
│   │   │       └── [id]/lessons/[id]/   # Lesson content
│   │   └── quizzes/                      # Quiz endpoints
│   │       └── attempts/                # Quiz submissions
│   ├── activity-logs/                    # Audit log viewer
│   ├── analytics/                        # Analytics dashboard
│   ├── auth/                             # Auth pages
│   │   ├── first-login/                 # First login flow
│   │   ├── login/                       # Login page
│   │   └── reset-password/              # Password reset page
│   ├── bulk-enroll/                      # Bulk enrollment UI
│   ├── dashboard/                        # Main dashboard (role-aware)
│   ├── learn/                            # Student learning interface
│   │   └── [id]/                        # Programme view
│   │       ├── lesson/[lessonId]/       # Lesson player
│   │       └── page.tsx                 # Programme overview
│   ├── my-programmes/                    # Student programme list
│   ├── programmes/                       # Programme management
│   │   ├── new/                         # Create programme
│   │   └── [id]/                        # Edit programme
│   ├── resources/                        # Resource library
│   ├── settings/                         # User settings
│   ├── students/                         # Lecturer student view
│   ├── users/                            # Admin user management
│   ├── globals.css                       # Global styles + prose
│   ├── layout.tsx                        # Root layout
│   └── page.tsx                          # Landing page
│
├── components/                           # React Components
│   ├── bulk-enroll/                     # Bulk enrollment components
│   │   └── bulk-enroll-client.tsx      # CSV upload UI (488 lines)
│   ├── dashboards/                      # Role-specific dashboards
│   │   ├── admin-dashboard.tsx         # Admin overview
│   │   ├── lecturer-dashboard.tsx      # Lecturer overview
│   │   └── student-dashboard.tsx       # Student overview
│   ├── programmes/                      # Programme components
│   │   ├── module-list.tsx             # Module manager
│   │   ├── lesson-list.tsx             # Lesson manager
│   │   └── content-editor.tsx          # Rich text editor
│   ├── quizzes/                         # Quiz components
│   │   ├── quiz-builder.tsx            # Visual quiz creator (673 lines)
│   │   ├── quiz-player.tsx             # Quiz taking UI (530 lines)
│   │   ├── question-editor.tsx         # Question form
│   │   └── grading-interface.tsx       # Manual grading
│   ├── resources/                       # Resource components
│   │   ├── resource-manager.tsx        # CRUD interface (468 lines)
│   │   ├── file-upload.tsx             # Upload component (338 lines)
│   │   └── resource-list.tsx           # Display resources
│   ├── users/                           # User components
│   │   ├── user-table.tsx              # User list
│   │   └── user-form.tsx               # Create/edit user
│   ├── ui/                              # Radix UI components
│   │   ├── button.tsx                  # Button variants
│   │   ├── card.tsx                    # Card component
│   │   ├── dialog.tsx                  # Modal dialogs
│   │   ├── dropdown-menu.tsx           # Dropdown menus
│   │   ├── input.tsx                   # Form inputs
│   │   ├── select.tsx                  # Select dropdowns
│   │   ├── table.tsx                   # Data tables
│   │   ├── tabs.tsx                    # Tab navigation
│   │   └── ...                         # 20+ more components
│   ├── footer.tsx                       # Site footer
│   ├── navbar.tsx                       # Navigation (role-based)
│   ├── theme-provider.tsx              # Dark/light theme
│   └── theme-toggle.tsx                # Theme switcher
│
├── lib/                                 # Utility Libraries
│   ├── auth.ts                         # NextAuth configuration
│   ├── prisma.ts                       # Prisma client singleton
│   ├── r2.ts                           # Cloudflare R2 helpers
│   │   ├── uploadFile()                # Upload to R2
│   │   ├── getSignedUrl()              # Generate download URL
│   │   └── deleteFile()                # Delete from R2
│   ├── resend.ts                       # Email client
│   ├── audit.ts                        # Audit logging
│   │   └── createAuditLog()            # Log user actions
│   ├── utils.ts                        # Helper functions
│   │   ├── cn()                        # Class name merger
│   │   └── formatDate()                # Date formatting
│   └── validations.ts                  # Zod schemas
│       ├── userSchema                  # User validation
│       ├── programmeSchema             # Programme validation
│       ├── quizSchema                  # Quiz validation
│       └── ...                         # More schemas
│
├── prisma/                              # Database
│   ├── schema.prisma                   # Schema definition (580 lines)
│   │   ├── 15 Models                   # Database tables
│   │   └── 10 Enums                    # Type definitions
│   ├── seed.ts                         # Seed script
│   │   ├── Demo users (3)              # Admin, lecturer, student
│   │   ├── Sample programme (1)        # With modules & lessons
│   │   └── Sample resources (5)        # Various types
│   ├── migrations/                     # SQL migrations
│   │   └── enable_rls.sql              # RLS policies (15 tables)
│   └── verify_rls.sql                  # RLS verification
│
├── generated/                           # Auto-generated
│   └── prisma/                         # Prisma Client
│       ├── client.ts                   # Type-safe client
│       ├── models/                     # Model types
│       └── enums.ts                    # Enum types
│
├── public/                              # Static Assets
│   ├── robots.txt                      # Search engine rules
│   └── ...                             # Images, icons, etc.
│
├── types/                               # TypeScript Definitions
│   └── next-auth.d.ts                  # NextAuth extensions
│
├── .env                                 # Environment variables
├── .env.example                         # Example env file
├── .gitignore                          # Git ignore rules
├── eslint.config.mjs                   # ESLint configuration
├── next.config.ts                      # Next.js configuration
├── next-env.d.ts                       # Next.js types
├── package.json                        # Dependencies & scripts
├── postcss.config.mjs                  # PostCSS config
├── prisma.config.ts                    # Prisma config
├── README.md                           # This file
├── tailwind.config.ts                  # Tailwind configuration
└── tsconfig.json                       # TypeScript configuration
```

---

## 🔌 API Reference

### **Authentication Endpoints**

#### `POST /api/auth/callback/credentials`

**Login with email and password**

**Request Body:**

```json
{
  "email": "admin@codezela.com",
  "password": "Admin@123"
}
```

**Response:**

```json
{
  "user": {
    "id": "clx123...",
    "email": "admin@codezela.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

### **Admin Endpoints**

#### `GET /api/admin/users`

**List all users with pagination**

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `role` (optional): Filter by role (ADMIN, LECTURER, STUDENT)
- `search` (optional): Search by name or email

#### `POST /api/admin/bulk-enroll/preview`

**Preview CSV bulk enrollment**

**Request Body (multipart/form-data):**

- `file`: CSV file with columns: `Email,Programme Code,Name (optional)`

**Response:**

```json
{
  "preview": [
    {
      "email": "student1@example.com",
      "programmeCode": "CS101",
      "name": "Student One",
      "status": "valid",
      "user": { "id": "...", "name": "..." },
      "programme": { "id": "...", "title": "..." }
    }
  ],
  "summary": {
    "total": 100,
    "valid": 98,
    "duplicates": 0,
    "errors": 2
  }
}
```

### **Student Endpoints**

#### `GET /api/student/programmes?filter=enrolled`

**List student's assigned programmes only**

#### `GET /api/student/programmes/[id]/lessons/[lessonId]`

**Get lesson content with resources**

**Response includes:**

- Lesson details (title, description, video URL, duration)
- All resources (FILE, EXTERNAL_LINK, EMBEDDED, TEXT_NOTE)
- Navigation (previous/next lessons)
- Progress tracking data

---

## 🗄 Database Schema

### **Models Overview**

The system uses **15 Prisma models**:

#### **Authentication & User Management**

1. **User** - User accounts with role-based access
2. **Account** - OAuth provider accounts (NextAuth)
3. **Session** - Active user sessions
4. **VerificationToken** - Email verification tokens

#### **Course Content**

5. **Course** - Main programme entity
6. **Module** - Programme sections/chapters
7. **Lesson** - Individual learning units
8. **LessonResource** - Attachments and materials
9. **ResourceVersion** - Resource version history

#### **Assessment**

10. **Quiz** - Quiz configuration and settings
11. **QuizQuestion** - Individual questions
12. **QuizAnswer** - Answer options for questions
13. **QuizAttempt** - Student quiz submissions
14. **QuizResponse** - Individual question responses

#### **Progress & Tracking**

15. **CourseEnrollment** - Student programme enrollments
16. **LessonProgress** - Lesson completion tracking

#### **System**

17. **Notification** - User notifications
18. **AuditLog** - Action audit trail
19. **UploadedFile** - File metadata registry

---

## 🚀 Deployment

### **Vercel Deployment (Recommended)**

1. **Push to GitHub:**

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

2. **Import to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository

3. **Set Environment Variables** in Vercel project settings

4. **Deploy** - Vercel auto-deploys on push to main

---

## 💡 Best Practices

### **Security Best Practices**

#### **Input Validation**

```typescript
// ✅ Always validate with Zod
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  name: z.string().min(1).max(100),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]),
});
```

#### **Authentication Checks**

```typescript
// ✅ Always check session
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### **Performance Tips**

#### **Use Server Components**

```typescript
// ✅ Default to server components
export default async function UsersPage() {
  const users = await prisma.user.findMany();
  return <UserList users={users} />;
}
```

---

## 🤝 Contributing

We welcome contributions from the community!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m "Add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

## 📄 License

This project is proprietary software developed by **Codezela Technologies**.

Copyright © 2024-2026 Codezela Technologies. All rights reserved.

For licensing inquiries, contact: [contact@codezela.com](mailto:contact@codezela.com)

---

## 🙏 Acknowledgments

Built with ❤️ by [Codezela Technologies](https://codezela.com)

### **Technologies Used**

- [Next.js](https://nextjs.org) - React framework
- [Prisma](https://prisma.io) - Database ORM
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Radix UI](https://radix-ui.com) - Components
- [Cloudflare R2](https://cloudflare.com/products/r2) - Storage
- [Supabase](https://supabase.com) - Database hosting
- [Vercel](https://vercel.com) - Deployment platform

---

## 📞 Support

Need help? Have questions?

- **Website**: [https://codezela.com](https://codezela.com)
- **Email**: [ca@codezela.com](mailto:ca@codezela.com)

---

<div align="center">

**Made with ❤️ by Codezela Technologies**

[Website](https://codezela.com) • [GitHub](https://github.com/codezela) • [Facebook](https://facebook.com/codezela) • [Instagram](https://instagram.com/codezela)

</div>
