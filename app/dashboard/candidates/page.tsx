"use client"

import { useEffect, useMemo, useState } from "react"
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
  Shield,
} from "lucide-react"

type CandidateStatus = "shortlisted" | "review" | "rejected"

type RankedCandidate = {
  candidate_id?: string
  candidate_name?: string
  candidate_email?: string
  phone?: string
  current_role?: string
  score?: number
  summary?: string
  strengths?: string[]
  gaps?: string[]
  recommendation?: string
  email_draft?: { subject?: string; body?: string }
}

type CandidateRow = {
  id: string
  name: string
  email: string
  role: string
  experience: string
  score: number
  skills: string[]
  status: CandidateStatus
  aiExplanation: string
  summary: string
  raw: RankedCandidate
}

const LS_KEY = "recruitai_ranked_candidates_v1"

function toCandidateRow(rc: RankedCandidate, idx: number): CandidateRow {
  const name = (rc.candidate_name || `Candidate ${idx + 1}`).trim()
  const email = (rc.candidate_email || "").trim()
  const role = (rc.current_role || "Candidate").trim()
  const score = typeof rc.score === "number" ? rc.score : 0

  // Convert strengths into “skills” badges for UI
  const skills = Array.isArray(rc.strengths) ? rc.strengths.slice(0, 6).map(s => s.slice(0, 22)) : []

  const explanation =
    (Array.isArray(rc.gaps) && rc.gaps.length > 0)
      ? `Top gap: ${rc.gaps[0]}`
      : (rc.recommendation ? `Recommendation: ${rc.recommendation}` : "AI assessed this candidate based on JD match and resume signals.")

  return {
    id: (rc.candidate_id || `cand_${idx}`),
    name,
    email: email || `${name.split(" ")[0].toLowerCase()}@example.com`,
    role,
    experience: "—",
    score,
    skills: skills.length ? skills : ["Resume parsed", "JD match"],
    status: "review",
    aiExplanation: explanation,
    summary: rc.summary || "—",
    raw: rc,
  }
}

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showUpload, setShowUpload] = useState(false)
  const [showDetail, setShowDetail] = useState<string | null>(null)
  const [sortField, setSortField] = useState<"score" | "name">("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Upload state
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [resumeFiles, setResumeFiles] = useState<File[]>([])
  const [isScoring, setIsScoring] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)

  // Real candidates state (replaces mock-data)
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>([])

  // Load from localStorage so it persists across navigation / refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      const ranked: RankedCandidate[] = parsed?.ranked_candidates || parsed || []
      if (Array.isArray(ranked) && ranked.length) {
        setCandidateRows(ranked.map(toCandidateRow))
      }
    } catch {
      // ignore
    }
  }, [])

  const filtered = useMemo(() => {
    return candidateRows
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        if (sortField === "score") return sortDir === "desc" ? b.score - a.score : a.score - b.score
        return sortDir === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      })
  }, [candidateRows, searchQuery, statusFilter, sortField, sortDir])

  const selectedCandidate = candidateRows.find((c) => c.id === showDetail)

  const toggleSort = (field: "score" | "name") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  // Update status actions
  const setStatus = (id: string, status: CandidateStatus) => {
    setCandidateRows((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    )
  }

  async function runScoring() {
    setScoreError(null)

    if (!jdFile) {
      setScoreError("Please upload a JD file first.")
      return
    }
    if (!resumeFiles.length) {
      setScoreError("Please upload at least 1 resume (3–5 recommended).")
      return
    }

    setIsScoring(true)
    try {
      // Send multipart/form-data to Vercel API (/api/score)
      const fd = new FormData()
      fd.append("recruiter_name", "Recruiter")
      fd.append("recruiter_email", "recruiter@example.com")
      fd.append("company", "Acme Inc")
      fd.append("job_title", "Position")
      fd.append("JD", jdFile)

      resumeFiles.forEach((f, i) => {
        fd.append(`resume_${i}`, f)
      })

      const r = await fetch("/api/score", { method: "POST", body: fd })
      const data = await r.json()

      if (!r.ok) {
        throw new Error(data?.error || data?.message || "Scoring failed")
      }

      // Expect n8n to return: { ranked_candidates: [...] }
      const ranked: RankedCandidate[] = data?.ranked_candidates || []

      if (!Array.isArray(ranked) || ranked.length === 0) {
        throw new Error("No ranked_candidates returned from Workflow A")
      }

      // Persist + update UI
      localStorage.setItem(LS_KEY, JSON.stringify({ ranked_candidates: ranked }))
      setCandidateRows(ranked.map(toCandidateRow))
      setShowUpload(false)
    } catch (e: any) {
      setScoreError(e?.message || String(e))
    } finally {
      setIsScoring(false)
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
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{selectedCandidate.name}</h1>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCandidate.role} &middot; {selectedCandidate.experience}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${selectedCandidate.score >= 85 ? "text-success" : selectedCandidate.score >= 75 ? "text-warning" : "text-destructive"}`}>
                    {selectedCandidate.score}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setStatus(selectedCandidate.id, "shortlisted")}
                  >
                    <ListChecks className="size-3.5 mr-1" />
                    Shortlist
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent text-foreground">
                    <CalendarClock className="size-3.5 mr-1" />
                    Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent text-destructive hover:bg-destructive/10"
                    onClick={() => setStatus(selectedCandidate.id, "rejected")}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>

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

          <div className="w-full lg:w-80 flex flex-col gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {(selectedCandidate.raw.strengths || []).slice(0, 6).map((s, i) => (
                    <div key={i} className="rounded-md border border-border p-2">
                      {s}
                    </div>
                  ))}
                  {(!selectedCandidate.raw.strengths || selectedCandidate.raw.strengths.length === 0) && (
                    <div className="text-xs">—</div>
                  )}
                </div>
              </CardContent>
            </Card>

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
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground mb-2">1) Upload JD (PDF/DOCX/TXT)</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                className="text-sm text-muted-foreground"
              />
              {jdFile && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected JD: <span className="text-foreground">{jdFile.name}</span>
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground mb-2">2) Upload Resumes (3–5 recommended)</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                onChange={(e) => setResumeFiles(Array.from(e.target.files || []))}
                className="text-sm text-muted-foreground"
              />
              {resumeFiles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected resumes: <span className="text-foreground">{resumeFiles.length}</span>
                </p>
              )}
            </div>

            {scoreError && (
              <div className="text-sm text-destructive">
                {scoreError}
              </div>
            )}

            <Button
              onClick={runScoring}
              disabled={isScoring}
              className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="size-4 mr-1" />
              {isScoring ? "Scoring..." : "Run AI Scoring"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              <span>Uploads go to Vercel → n8n Workflow A → candidates update automatically</span>
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
                <TableHead className="hidden md:table-cell">Strengths</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
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
                    {candidate.email}
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
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setStatus(candidate.id, "shortlisted")}>
                        <ListChecks className="size-3.5 text-primary" />
                        <span className="sr-only">Shortlist</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setStatus(candidate.id, "rejected")}>
                        <XCircle className="size-3.5 text-destructive" />
                        <span className="sr-only">Reject</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    No candidates yet. Upload JD + resumes and run AI scoring.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}