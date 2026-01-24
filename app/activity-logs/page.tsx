"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Clock,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Terminal,
  RefreshCw,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format, formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  actionTypes: string[];
  entityTypes: string[];
  users: { id: string; name: string | null; email: string | null }[];
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [action, setAction] = useState(searchParams.get("action") || "");
  const [entityType, setEntityType] = useState(
    searchParams.get("entityType") || "",
  );
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || "",
  );
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  useEffect(() => {
    fetchActivityLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, action, entityType, userId, startDate, endDate]);

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (action) params.set("action", action);
      if (entityType) params.set("entityType", entityType);
      if (userId) params.set("userId", userId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/admin/activity-logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch activity logs");

      const data = await response.json();
      setActivities(data.activities);
      setPagination(data.pagination);
      setFilters(data.filters);

      // Update URL
      router.push(`/activity-logs?${params}`, { scroll: false });
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setAction("");
    setEntityType("");
    setUserId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getActionBadge = (
    actionStr: string,
  ): "success" | "info" | "warning" | "danger" | "outline" | "default" => {
    if (actionStr.includes("LOGIN")) return "success";
    if (actionStr.includes("CREATE")) return "info";
    if (actionStr.includes("UPDATE")) return "warning";
    if (actionStr.includes("DELETE")) return "danger";
    return "outline";
  };

  const formatAction = (actionStr: string) => {
    return actionStr
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const exportToCSV = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "IP Address"],
      ...activities.map((a) => [
        format(new Date(a.createdAt), "yyyy-MM-dd HH:mm:ss"),
        a.user?.name || a.user?.email || "System",
        a.action,
        a.entityType || "",
        a.entityId || "",
        a.ipAddress || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-6 w-6 text-terminal-green" />
                <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
                  $ activity-logs
                </h1>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted">
                System activity and audit trail
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchActivityLogs}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={activities.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Search */}
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
                  <Input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  Action Type
                </label>
                <Select
                  value={action || "all"}
                  onValueChange={(value) => {
                    setAction(value === "all" ? "" : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {filters?.actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatAction(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Entity Type */}
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  Entity Type
                </label>
                <Select
                  value={entityType || "all"}
                  onValueChange={(value) => {
                    setEntityType(value === "all" ? "" : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filters?.entityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User */}
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  User
                </label>
                <Select
                  value={userId || "all"}
                  onValueChange={(value) => {
                    setUserId(value === "all" ? "" : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {filters?.users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(search ||
              action ||
              entityType ||
              userId ||
              startDate ||
              endDate) && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        {pagination && (
          <div className="mb-4">
            <p className="font-mono text-sm text-terminal-text-muted">
              Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.totalCount,
              )}{" "}
              of {pagination.totalCount} activities
            </p>
          </div>
        )}

        {/* Activity List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Activity className="h-12 w-12 text-terminal-text-muted mx-auto mb-4" />
                <p className="font-mono text-terminal-text-muted">
                  No activity logs found
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Card
                key={activity.id}
                className="hover:bg-terminal-green/5 transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div
                      className={`mt-1 h-3 w-3 rounded-full ${
                        activity.action.includes("LOGIN")
                          ? "bg-terminal-green"
                          : activity.action.includes("CREATE")
                            ? "bg-blue-400"
                            : activity.action.includes("UPDATE")
                              ? "bg-yellow-400"
                              : activity.action.includes("DELETE")
                                ? "bg-red-400"
                                : "bg-terminal-text-muted"
                      } shrink-0`}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getActionBadge(activity.action)}>
                              {formatAction(activity.action)}
                            </Badge>
                            {activity.entityType && (
                              <span className="text-sm font-mono text-terminal-green">
                                {activity.entityType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-mono text-terminal-text mt-2">
                            <span className="font-semibold">
                              {activity.user?.name ||
                                activity.user?.email ||
                                "System"}
                            </span>
                            {activity.user?.role && (
                              <span className="text-terminal-text-muted ml-2">
                                ({activity.user.role})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-mono text-terminal-text-muted flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <p className="text-xs font-mono text-terminal-text-muted mt-1">
                            {format(
                              new Date(activity.createdAt),
                              "MMM dd, yyyy HH:mm:ss",
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid gap-2 mt-3 text-xs font-mono text-terminal-text-muted">
                        {activity.entityId && (
                          <div className="flex items-center gap-2">
                            <span className="text-terminal-text">
                              Entity ID:
                            </span>
                            <code className="px-2 py-1 rounded bg-terminal-darker border border-terminal-green/20">
                              {activity.entityId}
                            </code>
                          </div>
                        )}
                        {activity.ipAddress && (
                          <div className="flex items-center gap-2">
                            <span className="text-terminal-text">IP:</span>
                            <code className="px-2 py-1 rounded bg-terminal-darker border border-terminal-green/20">
                              {activity.ipAddress}
                            </code>
                          </div>
                        )}
                        {activity.metadata &&
                          Object.keys(activity.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-terminal-green hover:underline">
                                View Metadata
                              </summary>
                              <pre className="mt-2 p-3 rounded bg-terminal-darker border border-terminal-green/20 overflow-x-auto text-xs">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-terminal-text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Page Jump */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="font-mono text-sm text-terminal-text-muted">
                  Go to page:
                </span>
                <Input
                  type="number"
                  min="1"
                  max={pagination.totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = parseInt(e.target.value);
                    if (newPage >= 1 && newPage <= pagination.totalPages) {
                      setPage(newPage);
                    }
                  }}
                  className="w-20 text-center"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
