"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Users, FileText, Terminal } from "lucide-react";
import Link from "next/link";

interface Programme {
  id: string;
  title: string;
  description: string;
  status: string;
  thumbnail: string | null;
  enrollmentCount: number;
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function LecturerProgrammesClient() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      const response = await fetch("/api/lecturer/programmes");
      if (response.ok) {
        const data = await response.json();
        setProgrammes(data.courses);
      }
    } catch (error) {
      console.error("Error fetching programmes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProgrammes = programmes.filter(
    (programme) =>
      programme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      programme.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-terminal-green">Loading programmes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ programmes --list
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Manage your assigned programmes
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
            <Input
              type="text"
              placeholder="$ search programmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <BookOpen className="h-6 w-6 text-terminal-green" />
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {programmes.length}
                </div>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted mt-2">
                My Programmes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Users className="h-6 w-6 text-terminal-green" />
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {programmes.reduce((sum, p) => sum + p.enrollmentCount, 0)}
                </div>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted mt-2">
                Total Students
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <FileText className="h-6 w-6 text-terminal-green" />
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {programmes.reduce((sum, p) => sum + p.moduleCount, 0)}
                </div>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted mt-2">
                Total Modules
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Programmes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Programmes ({filteredProgrammes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProgrammes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-terminal-text-muted mb-4" />
                <p className="font-mono text-terminal-text-muted">
                  {searchQuery
                    ? "No programmes found matching your search"
                    : "No programmes assigned yet"}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProgrammes.map((programme) => (
                  <div
                    key={programme.id}
                    className="p-6 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-mono font-semibold text-terminal-text mb-2">
                          {programme.title}
                        </h3>
                        <Badge
                          variant={
                            programme.status === "PUBLISHED"
                              ? "success"
                              : "default"
                          }
                        >
                          {programme.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>

                    <p className="font-mono text-sm text-terminal-text-muted mb-4 line-clamp-2">
                      {programme.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded bg-terminal-dark/50">
                        <div className="font-mono text-lg font-bold text-terminal-green">
                          {programme.enrollmentCount}
                        </div>
                        <p className="text-xs font-mono text-terminal-text-muted">
                          Students
                        </p>
                      </div>
                      <div className="text-center p-2 rounded bg-terminal-dark/50">
                        <div className="font-mono text-lg font-bold text-terminal-green">
                          {programme.moduleCount}
                        </div>
                        <p className="text-xs font-mono text-terminal-text-muted">
                          Modules
                        </p>
                      </div>
                      <div className="text-center p-2 rounded bg-terminal-dark/50">
                        <div className="font-mono text-lg font-bold text-terminal-green">
                          {programme.lessonCount}
                        </div>
                        <p className="text-xs font-mono text-terminal-text-muted">
                          Lessons
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/programmes/${programme.id}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          Manage Content
                        </Button>
                      </Link>
                    </div>

                    <div className="mt-3 pt-3 border-t border-terminal-green/10">
                      <p className="text-xs font-mono text-terminal-text-muted">
                        Updated{" "}
                        {new Date(programme.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
