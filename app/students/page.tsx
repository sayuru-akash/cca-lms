"use client";

import { useState } from "react";
import { Users, Search, Filter, Plus, Mail, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const students = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.j@example.com",
    enrolledCourses: 5,
    completedCourses: 3,
    progress: 87,
    status: "active",
    joinDate: "Jan 2025",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob.smith@example.com",
    enrolledCourses: 3,
    completedCourses: 2,
    progress: 65,
    status: "active",
    joinDate: "Dec 2024",
  },
  {
    id: 3,
    name: "Carol White",
    email: "carol.w@example.com",
    enrolledCourses: 7,
    completedCourses: 5,
    progress: 92,
    status: "active",
    joinDate: "Nov 2024",
  },
  {
    id: 4,
    name: "David Brown",
    email: "david.b@example.com",
    enrolledCourses: 4,
    completedCourses: 1,
    progress: 45,
    status: "active",
    joinDate: "Jan 2026",
  },
  {
    id: 5,
    name: "Eve Davis",
    email: "eve.davis@example.com",
    enrolledCourses: 6,
    completedCourses: 4,
    progress: 78,
    status: "active",
    joinDate: "Oct 2024",
  },
];

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6 text-terminal-green" />
              <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
                $ students --active
              </h1>
            </div>
            <p className="font-mono text-sm text-terminal-text-muted">
              Student management and progress tracking
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
            <Input
              type="text"
              placeholder="$ search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 hover:border-terminal-green/40 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full border-2 border-terminal-green bg-terminal-green/10 flex items-center justify-center font-mono font-bold text-terminal-green">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono font-semibold text-terminal-text">
                          {student.name}
                        </h3>
                        <Badge variant="success" className="text-[10px]">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-terminal-text-muted">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </span>
                        <span>Joined {student.joinDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-mono text-terminal-text-muted mb-1">
                        Enrolled
                      </p>
                      <p className="text-lg font-mono font-bold text-terminal-green">
                        {student.enrolledCourses}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-mono text-terminal-text-muted mb-1">
                        Completed
                      </p>
                      <p className="text-lg font-mono font-bold text-terminal-green">
                        {student.completedCourses}
                      </p>
                    </div>
                    <div className="min-w-30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-terminal-text-muted">
                          Progress
                        </span>
                        <span className="text-xs font-mono text-terminal-green font-semibold">
                          {student.progress}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                        <div
                          className="h-full bg-terminal-green rounded-full transition-all"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
