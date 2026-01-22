"use client";

import { useState } from "react";
import { BookOpen, Search, Filter, Plus, Users, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const courses = [
  {
    id: 1,
    title: "Advanced JavaScript Patterns",
    description:
      "Master design patterns, async programming, and modern JS techniques",
    students: 234,
    modules: 12,
    duration: "8 weeks",
    level: "Advanced",
    status: "active",
    completion: 78,
  },
  {
    id: 2,
    title: "Python for Data Science",
    description:
      "Learn data analysis, visualization, and machine learning with Python",
    students: 456,
    modules: 16,
    duration: "12 weeks",
    level: "Intermediate",
    status: "active",
    completion: 92,
  },
  {
    id: 3,
    title: "System Design Fundamentals",
    description: "Build scalable systems and learn architecture patterns",
    students: 189,
    modules: 10,
    duration: "6 weeks",
    level: "Advanced",
    status: "active",
    completion: 45,
  },
  {
    id: 4,
    title: "Web Development Bootcamp",
    description: "Full-stack development with React, Node.js, and databases",
    students: 678,
    modules: 20,
    duration: "16 weeks",
    level: "Beginner",
    status: "active",
    completion: 67,
  },
  {
    id: 5,
    title: "Machine Learning Basics",
    description: "Introduction to ML algorithms, neural networks, and AI",
    students: 567,
    modules: 14,
    duration: "10 weeks",
    level: "Intermediate",
    status: "active",
    completion: 63,
  },
  {
    id: 6,
    title: "DevOps Engineering",
    description: "CI/CD, Docker, Kubernetes, and cloud infrastructure",
    students: 345,
    modules: 11,
    duration: "8 weeks",
    level: "Advanced",
    status: "active",
    completion: 55,
  },
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-terminal-green" />
              <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
                $ courses --list
              </h1>
            </div>
            <p className="font-mono text-sm text-terminal-text-muted">
              Manage and monitor all learning programmes
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
            <Input
              type="text"
              placeholder="$ search courses..."
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

        {/* Courses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="group hover:scale-105 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant={
                      course.level === "Beginner"
                        ? "info"
                        : course.level === "Intermediate"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {course.level}
                  </Badge>
                  <Badge variant="success">Active</Badge>
                </div>
                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                    <Users className="h-4 w-4 mx-auto mb-1 text-terminal-green" />
                    <p className="text-xs font-mono text-terminal-text-muted">
                      {course.students}
                    </p>
                    <p className="text-[10px] font-mono text-terminal-text-muted">
                      Students
                    </p>
                  </div>
                  <div className="p-2 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                    <BookOpen className="h-4 w-4 mx-auto mb-1 text-terminal-green" />
                    <p className="text-xs font-mono text-terminal-text-muted">
                      {course.modules}
                    </p>
                    <p className="text-[10px] font-mono text-terminal-text-muted">
                      Modules
                    </p>
                  </div>
                  <div className="p-2 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-terminal-green" />
                    <p className="text-xs font-mono text-terminal-text-muted">
                      {course.duration}
                    </p>
                    <p className="text-[10px] font-mono text-terminal-text-muted">
                      Duration
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-terminal-text-muted">
                      Progress
                    </span>
                    <span className="text-xs font-mono text-terminal-green font-semibold">
                      {course.completion}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                    <div
                      className="h-full bg-terminal-green rounded-full transition-all"
                      style={{ width: `${course.completion}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    View Details
                  </Button>
                  <Button className="flex-1" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
