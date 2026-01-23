"use client";

import { BookOpen, Users, Terminal, FileText } from "lucide-react";
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

interface LecturerDashboardProps {
  user: {
    id: string;
    role: $Enums.UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const stats = [
  { title: "Assigned Programmes", value: "3", icon: BookOpen },
  { title: "My Students", value: "89", icon: Users },
  { title: "Published Modules", value: "24", icon: FileText },
];

const myProgrammes = [
  {
    id: 1,
    name: "Web Development Bootcamp",
    students: 45,
    modules: 12,
    status: "active",
  },
  {
    id: 2,
    name: "Advanced JavaScript",
    students: 28,
    modules: 8,
    status: "active",
  },
  {
    id: 3,
    name: "React Masterclass",
    students: 16,
    modules: 6,
    status: "draft",
  },
];

export default function LecturerDashboard({ user }: LecturerDashboardProps) {
  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ lecturer-dashboard
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Manage your assigned programmes and students
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-6 w-6 text-terminal-green" />
                    <div className="text-3xl font-bold font-mono text-terminal-green">
                      {stat.value}
                    </div>
                  </div>
                  <p className="font-mono text-sm text-terminal-text-muted">
                    {stat.title}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* My Programmes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Programmes
                </CardTitle>
                <CardDescription>
                  Programmes you&apos;re teaching
                </CardDescription>
              </div>
              <Button size="sm">Create Module</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myProgrammes.map((programme) => (
              <div
                key={programme.id}
                className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-mono font-semibold text-terminal-text">
                      {programme.name}
                    </h3>
                    <Badge
                      variant={
                        programme.status === "active" ? "success" : "default"
                      }
                    >
                      {programme.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-mono text-terminal-text-muted">
                    <span>{programme.students} students</span>
                    <span>•</span>
                    <span>{programme.modules} modules</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
