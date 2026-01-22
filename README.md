# CCA LMS - Terminal Edition 🖥️

A modern, production-ready Learning Management System with a unique **terminal/hacker aesthetic**. Built with Next.js 16, TypeScript, Prisma, and featuring complete dark/light mode support.

## ✨ Features

### 🎨 Terminal Aesthetic Design
- **Unique UI**: Complete terminal-inspired interface with green monospace fonts
- **Matrix-style Effects**: Glow effects, scan lines, and subtle animations
- **Dark/Light Mode**: Full theme support with seamless switching
- **Theme Toggle**: Beautiful animated toggle in top-right corner
- **Responsive**: Fully mobile-friendly design

### 🚀 Core Functionality
- **Dashboard**: Real-time stats, activity feed, system logs
- **Course Management**: Create, edit, and monitor courses
- **Student Management**: Track progress, enrollments, and achievements
- **Analytics**: Detailed metrics with visual charts
- **Resources**: File management with categorization
- **Settings**: User preferences and system configuration

### 🎯 User Roles & Permissions
- **Admin**: Full system access and management
- **Lecturer**: Course and student management
- **Student**: View courses and track progress

### 🔐 Security Features
- NextAuth.js v5 authentication
- Row-Level Security (RLS) with Prisma
- Secure file uploads with R2
- Audit logging for all actions

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.4 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Theme**: next-themes
- **Storage**: Cloudflare R2
- **Email**: Resend

## 🎨 Design System

### Color Palette
```css
/* Light Mode */
--terminal-green: #22c55e
--terminal-green-light: #4ade80
--terminal-green-dark: #16a34a
--background: #f0f4f0
--terminal-card: rgba(255, 255, 255, 0.8)

/* Dark Mode */
--terminal-green: #22c55e
--terminal-darker: #050805
--terminal-dark: #0a0f0a
--terminal-card: rgba(10, 15, 10, 0.8)
```

### Typography
- **Primary Font**: Geist Mono (monospace)
- **Terminal Glow Effect**: Applied to headings
- **Consistent Spacing**: 8px grid system

### Components
- **Button**: 4 variants (default, outline, ghost, danger)
- **Card**: Glowing borders with backdrop blur
- **Input**: Terminal-style with glow focus
- **Badge**: Color-coded status indicators
- **Navigation**: Sticky header with active states

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd cca-lms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Set up database
npm run db:generate
npm run db:push
npm run db:seed

# Run development server
npm run dev
```

## 🚀 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database commands
npm run db:studio      # Open Prisma Studio
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
```

## 📁 Project Structure

```
cca-lms/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── courses/           # Courses page
│   ├── students/          # Students page
│   ├── analytics/         # Analytics page
│   ├── resources/         # Resources page
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout with theme
│   ├── page.tsx           # Dashboard
│   ├── loading.tsx        # Loading state
│   ├── error.tsx          # Error boundary
│   └── not-found.tsx      # 404 page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── navbar.tsx        # Navigation bar
│   ├── footer.tsx        # Footer
│   ├── theme-provider.tsx # Theme context
│   └── theme-toggle.tsx  # Dark/light toggle
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   ├── r2.ts             # R2 storage
│   ├── resend.ts         # Email client
│   ├── cn.ts             # Class name utility
│   └── validations.ts    # Zod schemas
├── prisma/               # Database schema
│   ├── schema.prisma     # Prisma schema
│   ├── seed.ts           # Database seeder
│   └── migrations/       # Migration files
└── types/                # TypeScript types
```

## 🎭 Theme System

The application uses `next-themes` for theme management with seamless dark/light mode switching.

### Theme Features
- **System Preference Detection**: Automatically detects OS theme
- **Persistent**: Theme choice saved to localStorage
- **No Flash**: Prevents white flash on page load
- **CSS Variables**: All colors defined as CSS custom properties
- **Smooth Transitions**: Animated theme switching

## 🔥 Special Effects

### Scan Line Effect
Subtle moving line across the screen for terminal effect

### Glow Effect
Terminal green glow on interactive elements

### Hover States
All cards and buttons feature glow effects on hover

## 📱 Pages Overview

### Dashboard (/)
- Real-time statistics cards
- Active courses list with progress
- Live activity feed
- Quick action buttons
- System status monitoring
- Terminal-style system logs

### Courses (/courses)
- Course grid with cards
- Search and filter functionality
- Student enrollment stats
- Progress tracking
- Create/manage courses

### Students (/students)
- Student directory
- Progress tracking
- Enrollment management
- Contact information
- Activity history

### Analytics (/analytics)
- Key performance metrics
- Top performing courses
- Revenue tracking
- Engagement statistics
- Interactive charts

### Resources (/resources)
- File management
- Storage statistics
- Download tracking
- File type categorization
- Upload functionality

### Settings (/settings)
- Profile management
- Notification preferences
- Security settings
- System configuration
- Platform information

## 🎯 Best Practices

### Component Development
- Use TypeScript for type safety
- Follow atomic design principles
- Implement proper error boundaries
- Use Server Components where possible
- Optimize with React.memo for complex components

### Styling
- Use Tailwind utility classes
- Follow the design system colors
- Maintain consistent spacing
- Ensure accessibility (WCAG 2.1 AA)
- Test on multiple screen sizes

### Performance
- Lazy load heavy components
- Optimize images with next/image
- Use Suspense boundaries
- Implement proper caching
- Monitor Core Web Vitals

## 📄 License

This project is proprietary and confidential.

---

**Built with 💚 using terminal aesthetics and modern web technologies**
