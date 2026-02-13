"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { candidates } from "@/lib/mock-data"
import {
  Upload,
  Search,
  Sparkles,
  ListChecks,
  XCircle,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  Brain,
  BarChart3,
  MessageSquare,
  CalendarClock,
  X,
  Shield,
} from "lucide-react"

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showUpload, setShowUpload] = useState(false)
  const [showDetail, setShowDetail] = useState<string | null>(null)
  const [sortField, setSortField] = useState<"score" | "name">("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const filtered = candidates
    .filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortField === "score") return sortDir === "desc" ? b.score - a.score : a.score - b.score
      return sortDir === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    })

  const selectedCandidate = candidates.find((c) => c.id === showDetail)

  const toggleSort = (field: "score" | "name") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  if (selectedCandidate) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" onClick={() => setShowDetail(null)} className="w-fit text-foreground">
          <ChevronLeft className="size-4 mr-1" />
          Back to candidates
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            {/* Header */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{selectedCandidate.name}</h1>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedCandidate.role} &middot; {selectedCandidate.experience}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${selectedCandidate.score >= 85 ? "text-success" : selectedCandidate.score >= 75 ? "text-warning" : "text-destructive"}`}>
                      {selectedCandidate.score}%
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <ListChecks className="size-3.5 mr-1" />
                    Shortlist
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent text-foreground">
                    <CalendarClock className="size-3.5 mr-1" />
                    Schedule
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent text-destructive hover:bg-destructive/10">
                    <XCircle className="size-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Explanation */}
            <Card className="border-primary/20 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Brain className="size-4 text-primary" />
                  AI Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedCandidate.aiExplanation}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="size-3.5 text-primary" />
                  <span>Human review required before any action</span>
                </div>
              </CardContent>
            </Card>

            {/* Resume Summary */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Resume Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedCandidate.summary}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right panel */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            {/* Skills */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Skills Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {selectedCandidate.skills.map((skill) => {
                    const matchLevel = Math.floor(Math.random() * 30) + 70
                    return (
                      <div key={skill}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{skill}</span>
                          <span className="text-xs text-muted-foreground">{matchLevel}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all"
                            style={{ width: `${matchLevel}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-24 rounded-md border border-input bg-transparent p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add notes about this candidate..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-ranked candidates across all roles.
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="size-4 mr-1" />
          Upload Resumes
        </Button>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="rounded-lg border-2 border-dashed border-border p-12 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
              <Upload className="size-10 mb-3" />
              <p className="font-medium text-foreground">Drag & drop resumes here</p>
              <p className="text-sm mt-1">PDF, DOCX up to 10MB each. Batch upload supported.</p>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <Sparkles className="size-3.5 text-primary" />
                <span>AI will parse, score, and rank automatically</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "shortlisted", "review", "rejected"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground"}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Candidates Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-foreground">
                    Name <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("score")} className="flex items-center gap-1 text-foreground">
                    AI Score <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Skills</TableHead>
                <TableHead className="hidden lg:table-cell">Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.role}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${candidate.score >= 85 ? "text-success" : candidate.score >= 75 ? "text-warning" : "text-destructive"}`}>
                      {candidate.score}%
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs font-normal">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {candidate.experience}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        candidate.status === "shortlisted"
                          ? "default"
                          : candidate.status === "review"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        candidate.status === "shortlisted"
                          ? "bg-success text-success-foreground"
                          : candidate.status === "rejected"
                          ? "text-destructive"
                          : ""
                      }
                    >
                      {candidate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setShowDetail(candidate.id)}>
                        <Eye className="size-3.5 text-foreground" />
                        <span className="sr-only">View details</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8">
                        <ListChecks className="size-3.5 text-primary" />
                        <span className="sr-only">Shortlist</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8">
                        <XCircle className="size-3.5 text-destructive" />
                        <span className="sr-only">Reject</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
