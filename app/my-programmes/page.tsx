"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Clock, Loader2, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Programme {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isEnrolled: boolean;
  enrollment: {
    status: string;
    progress: number;
    enrolledAt: string;
  } | null;
  stats: {
    totalLessons: number;
    moduleCount: number;
    enrollmentCount: number;
  };
}

export default function MyProgrammesPage() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      setIsLoading(true);
      // Only fetch enrolled programmes
      const response = await fetch(`/api/student/programmes?filter=enrolled`);
      if (!response.ok) throw new Error("Failed to fetch programmes");

      const data = await response.json();
      setProgrammes(data.programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow mb-2">
            $ my-programmes
          </h1>
          <p className="font-mono text-sm text-terminal-text-muted">
            Your assigned learning programmes
          </p>
        </div>

        {/* Programmes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
          </div>
        ) : programmes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-terminal-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Programmes Assigned
                </h3>
                <p className="font-mono text-terminal-text-muted">
                  You haven&apos;t been enrolled in any programmes yet.
                  <br />
                  Contact your administrator to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme) => (
              <Card
                key={programme.id}
                className="flex flex-col hover:border-terminal-green/50 transition-all cursor-pointer"
                onClick={() => router.push(`/learn/${programme.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="font-mono text-lg leading-tight">
                      {programme.title}
                    </CardTitle>
                    {programme.isEnrolled && (
                      <Badge variant="success" className="shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {programme.description || "No description available"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-3">
                    {programme.enrollment && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-terminal-text-muted">
                            Progress
                          </span>
                          <span className="text-terminal-green font-semibold">
                            {Math.round(programme.enrollment.progress)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                          <div
                            className="h-full bg-terminal-green rounded-full transition-all"
                            style={{
                              width: `${programme.enrollment.progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs font-mono text-terminal-text-muted">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {programme.stats.moduleCount} modules
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {programme.stats.totalLessons} lessons
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/learn/${programme.id}`);
                    }}
                  >
                    <Play className="h-4 w-4" />
                    Continue Learning
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
