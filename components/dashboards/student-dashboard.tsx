"use client";

import { BookOpen, CheckCircle2, Clock, Terminal, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { $Enums } from "@prisma/client";

interface StudentDashboardProps {
  user: {
    id: string;
    role: $Enums.UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const enrolledProgrammes = [
  {
    id: 1,
    name: "Web Development Bootcamp",
    progress: 68,
    nextLesson: "React Hooks Deep Dive",
    dueDate: "Jan 25, 2026",
  },
  {
    id: 2,
    name: "Advanced JavaScript",
    progress: 45,
    nextLesson: "Async Programming Patterns",
    dueDate: "Jan 28, 2026",
  },
];

const recentActivity = [
  { id: 1, text: "Completed lesson: CSS Grid Layout", time: "2 hours ago" },
  { id: 2, text: "Submitted assignment: React Todo App", time: "1 day ago" },
  { id: 3, text: "Started module: Advanced React", time: "2 days ago" },
];

export default function StudentDashboard({ user }: StudentDashboardProps) {
  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ student-dashboard
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Your learning journey and progress
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enrolled Programmes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Programmes
                </CardTitle>
                <CardDescription>Continue your learning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrolledProgrammes.map((programme) => (
                  <div
                    key={programme.id}
                    className="p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-mono font-semibold text-terminal-text">
                        {programme.name}
                      </h3>
                      <Badge variant="info">{programme.progress}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                        <div
                          className="h-full bg-terminal-green rounded-full"
                          style={{ width: `${programme.progress}%` }}
                        />
                      </div>
                      <p className="text-sm font-mono text-terminal-text-muted">
                        Next: {programme.nextLesson}
                      </p>
                      <p className="text-xs font-mono text-terminal-text-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {programme.dueDate}
                      </p>
                    </div>
                    <Button className="w-full mt-3 gap-2">
                      <Play className="h-4 w-4" />
                      Continue Learning
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your learning history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-md border border-terminal-green/10 bg-terminal-darker/30"
                >
                  <CheckCircle2 className="h-4 w-4 text-terminal-green shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-mono text-terminal-text">
                      {activity.text}
                    </p>
                    <p className="text-xs font-mono text-terminal-text-muted mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
