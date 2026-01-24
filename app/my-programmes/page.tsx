"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Loader2,
  Play,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("enrolled");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProgrammes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  const fetchProgrammes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter) params.set("filter", filter);

      const response = await fetch(`/api/student/programmes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch programmes");

      const data = await response.json();
      setProgrammes(data.programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (programmeId: string) => {
    try {
      setEnrollingId(programmeId);
      const response = await fetch(
        `/api/student/programmes/${programmeId}/enroll`,
        {
          method: "POST",
        },
      );

      if (!response.ok) throw new Error("Failed to enroll");

      // Refresh programmes list
      await fetchProgrammes();

      // Navigate to the programme
      router.push(`/learn/${programmeId}`);
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("Failed to enroll in programme");
    } finally {
      setEnrollingId(null);
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
            Programmes you are enrolled in
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
                <Input
                  placeholder="Search programmes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programmes</SelectItem>
                  <SelectItem value="enrolled">My Programmes</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                <p className="font-mono text-terminal-text-muted">
                  No programmes found
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
                  {programme.isEnrolled ? (
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
                  ) : (
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      disabled={enrollingId === programme.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(programme.id);
                      }}
                    >
                      {enrollingId === programme.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
