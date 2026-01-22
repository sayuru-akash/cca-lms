"use client";

import { FileText, Download, Upload, Search, Filter, File, Video, Image as ImageIcon, FileArchive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const resources = [
  {
    id: 1,
    name: "Course Syllabus - Web Dev.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedBy: "Admin",
    uploadDate: "Jan 20, 2026",
    downloads: 234,
  },
  {
    id: 2,
    name: "JavaScript Cheatsheet.pdf",
    type: "pdf",
    size: "1.2 MB",
    uploadedBy: "Admin",
    uploadDate: "Jan 18, 2026",
    downloads: 567,
  },
  {
    id: 3,
    name: "Python Tutorial Video.mp4",
    type: "video",
    size: "45.8 MB",
    uploadedBy: "Instructor",
    uploadDate: "Jan 15, 2026",
    downloads: 892,
  },
  {
    id: 4,
    name: "React Components Guide.pdf",
    type: "pdf",
    size: "3.1 MB",
    uploadedBy: "Admin",
    uploadDate: "Jan 12, 2026",
    downloads: 345,
  },
  {
    id: 5,
    name: "Database Schema Diagram.png",
    type: "image",
    size: "856 KB",
    uploadedBy: "Admin",
    uploadDate: "Jan 10, 2026",
    downloads: 178,
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return File;
    case "video":
      return Video;
    case "image":
      return ImageIcon;
    default:
      return FileArchive;
  }
};

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-6 w-6 text-terminal-green" />
              <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
                $ resources --list
              </h1>
            </div>
            <p className="font-mono text-sm text-terminal-text-muted">
              Course materials and learning resources
            </p>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Resource
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
            <Input
              type="text"
              placeholder="$ search resources..."
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

        {/* Storage Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted">
                Total Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-terminal-green mb-2">
                2.8 GB
              </div>
              <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                <div className="h-full bg-terminal-green rounded-full" style={{ width: "56%" }} />
              </div>
              <p className="text-xs font-mono text-terminal-text-muted mt-2">
                56% of 5 GB used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted">
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-terminal-green">
                342
              </div>
              <p className="text-xs font-mono text-terminal-text-muted mt-2">
                <span className="text-terminal-green">+24</span> files this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted">
                Total Downloads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-terminal-green">
                8,456
              </div>
              <p className="text-xs font-mono text-terminal-text-muted mt-2">
                <span className="text-terminal-green">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resources List */}
        <Card>
          <CardHeader>
            <CardTitle>All Resources</CardTitle>
            <CardDescription>Course materials and documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.map((resource) => {
                const FileIcon = getFileIcon(resource.type);
                return (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 hover:border-terminal-green/40 transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-lg border border-terminal-green bg-terminal-green/10 flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-terminal-green" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-mono font-semibold text-terminal-text mb-1">
                          {resource.name}
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-mono text-terminal-text-muted">
                          <span>{resource.size}</span>
                          <span>•</span>
                          <span>By {resource.uploadedBy}</span>
                          <span>•</span>
                          <span>{resource.uploadDate}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {resource.downloads} downloads
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={resource.type === "pdf" ? "info" : resource.type === "video" ? "warning" : "default"}>
                        {resource.type.toUpperCase()}
                      </Badge>
                      <Button size="icon" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
