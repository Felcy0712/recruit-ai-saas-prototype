"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Upload, Search, Sparkles, ListChecks, XCircle, Eye, ArrowUpDown,
  ChevronLeft, Brain, BarChart3, MessageSquare, CalendarClock, Shield,
  FileText, Files, CheckCircle2, X, Send, Loader2, Mail,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  emailSubject: string
  emailBody: string
  rejectSubject: string
  rejectBody: string
  raw: RankedCandidate
}

type Recruiter = {
  username: string
  email: string
  first_name: string
  last_name: string
  company: string
}

function toCandidateRow(c: any, idx: number): CandidateRow {
  const name = (c.candidate_name || `Candidate ${idx + 1}`).trim()
  const email = (c.candidate_email || "").trim()
  const role = (c.current_role || "Candidate").trim()
  const score = typeof c.score === "number" ? c.score : 0
  const skills = Array.isArray(c.strengths) ? c.strengths.slice(0, 6).map((s: string) => s.slice(0, 22)) : []
  const firstName = name.split(" ")[0]
  const explanation =
    Array.isArray(c.gaps) && c.gaps.length > 0
      ? `Top gap: ${c.gaps[0]}`
      : c.recommendation
      ? `Recommendation: ${c.recommendation}`
      : "AI assessed this candidate based on JD match and resume signals."

  return {
    id: c.candidate_id || `db_${c.id}`,
    name,
    email: email || `${firstName.toLowerCase()}@example.com`,
    role,
    experience: c.years_of_experience ? `${c.years_of_experience} yrs` : "—",
    score,
    skills: skills.length ? skills : ["Resume parsed", "JD match"],
    status: score > 85 ? "shortlisted" : score > 70 ? "review" : "rejected",
    aiExplanation: explanation,
    summary: c.summary || "—",
    emailSubject: c.email_subject || `Your application at ${c.current_company || "us"}`,
    emailBody: c.email_body || "",
    rejectSubject: `Your application for ${role}`,
    rejectBody: `Dear ${firstName},\n\nThank you for taking the time to apply and for your interest in joining our team.\n\nAfter carefully reviewing your profile, we have decided to move forward with other candidates whose experience more closely matches our current requirements.\n\nWe genuinely appreciate the time you invested in this process and encourage you to apply for future openings that align with your skills.\n\nWe wish you all the best in your job search.\n\nBest regards,\n[Recruiter]\n[Company]`,
    raw: {
      candidate_id: c.candidate_id,
      candidate_name: c.candidate_name,
      candidate_email: c.candidate_email,
      strengths: c.strengths,
      gaps: c.gaps,
      recommendation: c.recommendation,
      email_draft: { subject: c.email_subject, body: c.email_body },
    },
  }
}

// ── FileUploadButton ──────────────────────────────────────────────────────────
function FileUploadButton({
  label, subLabel, accept, multiple = false, icon: Icon, files, onChange,
}: {
  label: string
  subLabel: string
  accept: string
  multiple?: boolean
  icon: React.ElementType
  files: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    onChange(multiple ? [...files, ...picked] : [picked[0]])
    e.target.value = ""
  }
  const removeFile = (idx: number) => onChange(files.filter((_, i) => i !== idx))
  const hasFiles = files.length > 0
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${hasFiles ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
            {hasFiles ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{subLabel}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 gap-2 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary">
          <Upload className="size-3.5" />
          {hasFiles ? (multiple ? "Add more" : "Replace") : "Choose file" + (multiple ? "s" : "")}
        </Button>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
      </div>
      {hasFiles && (
        <div className="flex flex-wrap gap-2 pl-12">
          {files.map((f, i) => (
            <div key={`file-${i}-${f.name}`} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-foreground">
              <FileText className="size-3 text-primary shrink-0" />
              <span className="max-w-[160px] truncate">{f.name}</span>
              <span className="text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
              <button onClick={() => removeFile(i)} className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({
  candidate, recruiter, onClose, onStatusChange,
}: {
  candidate: CandidateRow
  recruiter: Recruiter | null
  onClose: () => void
  onStatusChange: (id: string, status: CandidateStatus) => void
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const recruiterName = recruiter
    ? `${recruiter.first_name} ${recruiter.last_name}`.trim()
    : "Recruiter"
  const company = recruiter?.company || "Company"

  const rejectBody = candidate.rejectBody
    .replace("[Recruiter]", recruiterName)
    .replace("[Company]", company)

  async function sendReject() {
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          candidate_email: candidate.email,
          recruiter_name: recruiterName,
          recruiter_email: recruiter?.email || "",
          company,
          email_subject: candidate.rejectSubject,
          email_body: rejectBody,
        }),
      })
      if (!res.ok) throw new Error("Failed to send")
      setSent(true)
      onStatusChange(candidate.id, "rejected")
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background border border-border rounded-xl shadow-xl p-6 flex flex-col gap-4 mx-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Mail className="size-4 text-destructive" />
              Send Rejection Email
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review before sending to{" "}
              <span className="font-medium text-foreground">{candidate.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm flex flex-col gap-2">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">To:</span>{" "}
            {candidate.name}{candidate.email && ` (${candidate.email})`}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Subject:</span>{" "}
            {candidate.rejectSubject}
          </p>
          <div className="border-t border-border pt-3 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
            {rejectBody}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent text-foreground" onClick={onClose}>
            Cancel
          </Button>
          {sent ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-emerald-500 font-medium">
              <CheckCircle2 className="size-4" /> Email Sent!
            </div>
          ) : (
            <Button onClick={sendReject} disabled={sending}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white">
              {sending ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Send className="size-4 mr-1" />}
              {sending ? "Sending..." : "Send Rejection Email"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showUpload, setShowUpload] = useState(false)
  const [showDetail, setShowDetail] = useState<string | null>(null)
  const [rejectCandidate, setRejectCandidate] = useState<CandidateRow | null>(null)
  const [sortField, setSortField] = useState<"score" | "name">("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [resumeFiles, setResumeFiles] = useState<File[]>([])
  const [isScoring, setIsScoring] = useState(false)
  const [scoringStatus, setScoringStatus] = useState<string>("")
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>([])
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchCandidates(): Promise<number> {
    const supabase = createClient()
    const { data: candidates } = await supabase
      .from("comm_candidate")
      .select("*")
      .order("created_at", { ascending: false })

    if (candidates && candidates.length > 0) {
      setCandidateRows(candidates.map((c: any, i: number) => toCandidateRow(c, i)))
      return candidates.length
    }
    return 0
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const stored = localStorage.getItem("recruitai-user")
      if (!stored) return
      const { email } = JSON.parse(stored)
      const { data: userData } = await supabase
        .from("comm_user")
        .select("username, email, first_name, last_name, company")
        .eq("email", email)
        .maybeSingle()
      if (userData) setRecruiter(userData)
      await fetchCandidates()
    }
    loadData()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
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
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  const setStatus = async (id: string, status: CandidateStatus) => {
    const supabase = createClient()
    await supabase.from("comm_candidate").update({ status }).eq("candidate_id", id)
    setCandidateRows((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  async function runScoring() {
    setScoreError(null)
    setScoringStatus("")
    if (!jdFile) { setScoreError("Please upload a JD file first."); return }
    if (!resumeFiles.length) { setScoreError("Please upload at least 1 resume (3–5 recommended)."); return }
    setIsScoring(true)
    setScoringStatus("Sending files to AI...")
    try {
      const fd = new FormData()
      fd.append("recruiter_name", recruiter ? `${recruiter.first_name} ${recruiter.last_name}`.trim() : "Recruiter")
      fd.append("recruiter_email", recruiter?.email || "recruiter@example.com")
      fd.append("company", recruiter?.company || "")
      fd.append("job_title", "Position")
      fd.append("job_id", `JOB-${Date.now()}`)
      fd.append("JD", jdFile)
      resumeFiles.forEach((f, i) => fd.append(`resume_${i}`, f))
      fetch("/api/score", { method: "POST", body: fd }).catch(() => {})
      setScoringStatus("AI is analysing resumes... this may take a minute.")
      const previousCount = candidateRows.length
      let attempts = 0
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        attempts++
        const newCount = await fetchCandidates()
        if (newCount > previousCount) {
          if (pollRef.current) clearInterval(pollRef.current)
          setScoringStatus("")
          setShowUpload(false)
          setIsScoring(false)
        }
        if (attempts >= 60) {
          if (pollRef.current) clearInterval(pollRef.current)
          setIsScoring(false)
          setScoringStatus("")
          setScoreError("Scoring is taking longer than expected. Please refresh the page to see results.")
        }
      }, 5000)
    } catch (e: any) {
      setScoreError(e?.message || String(e))
      setIsScoring(false)
      setScoringStatus("")
    }
  }

  // ── Detail View ────────────────────────────────────────────────────────────
  // ✅ RejectModal is now included here too so it works from the detail view
  if (selectedCandidate) {
    return (
      <>
        {rejectCandidate && (
          <RejectModal
            candidate={rejectCandidate}
            recruiter={recruiter}
            onClose={() => setRejectCandidate(null)}
            onStatusChange={(id, status) => {
              setStatus(id, status)
              setRejectCandidate(null)
            }}
          />
        )}

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
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setStatus(selectedCandidate.id, "shortlisted")}>
                      <ListChecks className="size-3.5 mr-1" /> Shortlist
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent text-foreground">
                      <CalendarClock className="size-3.5 mr-1" /> Schedule
                    </Button>
                    {/* ✅ Reject button in detail view now opens modal directly */}
                    <Button size="sm" variant="outline"
                      className="bg-transparent text-destructive hover:bg-destructive/10"
                      onClick={() => setRejectCandidate(selectedCandidate)}>
                      <XCircle className="size-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Brain className="size-4 text-primary" /> AI Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedCandidate.aiExplanation}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="size-3.5 text-primary" />
                    <span>Human review required before any action</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-foreground">Resume Summary</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedCandidate.summary}</p>
                </CardContent>
              </Card>
            </div>

            <div className="w-full lg:w-80 flex flex-col gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" /> Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {(selectedCandidate.raw.strengths || []).slice(0, 6).map((s, i) => (
                      <div key={`strength-${selectedCandidate.id}-${i}`} className="rounded-md border border-border p-2">{s}</div>
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
                    <MessageSquare className="size-4 text-primary" /> Notes
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
      </>
    )
  }

  // ── List View ──────────────────────────────────────────────────────────────
  return (
    <>
      {rejectCandidate && (
        <RejectModal
          candidate={rejectCandidate}
          recruiter={recruiter}
          onClose={() => setRejectCandidate(null)}
          onStatusChange={(id, status) => {
            setStatus(id, status)
            setRejectCandidate(null)
          }}
        />
      )}

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-ranked candidates across all roles.
              {recruiter && (
                <span className="ml-2 text-primary font-medium">
                  · {recruiter.first_name} {recruiter.last_name}
                  {recruiter.company && ` · ${recruiter.company}`}
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="size-4 mr-1" /> Upload Resumes
          </Button>
        </div>

        {showUpload && (
          <Card className="border-border">
            <CardContent className="pt-6 flex flex-col gap-5">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold shrink-0">1</span>
                  <p className="text-sm font-semibold text-foreground">Upload Job Description</p>
                </div>
                <FileUploadButton
                  label="Job Description file" subLabel="PDF, DOCX or TXT · single file"
                  accept=".pdf,.doc,.docx,.txt" multiple={false} icon={FileText}
                  files={jdFile ? [jdFile] : []} onChange={(f) => setJdFile(f[0] ?? null)} />
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold shrink-0">2</span>
                  <p className="text-sm font-semibold text-foreground">
                    Upload Resumes <span className="ml-1 font-normal text-muted-foreground">(3–5 recommended)</span>
                  </p>
                </div>
                <FileUploadButton
                  label="Candidate resumes" subLabel="PDF or DOCX · multiple files allowed"
                  accept=".pdf,.doc,.docx" multiple={true} icon={Files}
                  files={resumeFiles} onChange={setResumeFiles} />
              </div>
              {scoreError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2.5">
                  <XCircle className="size-4 shrink-0" /> {scoreError}
                </div>
              )}
              {scoringStatus && (
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
                  <Sparkles className="size-4 shrink-0 animate-pulse" /> {scoringStatus}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={runScoring} disabled={isScoring || !jdFile || !resumeFiles.length}
                  className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <Sparkles className="size-4 mr-1" />
                  {isScoring ? "Scoring..." : "Run AI Scoring"}
                </Button>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  Files sent to n8n → results saved to Supabase → candidates update automatically
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search candidates..." className="pl-9" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {["all", "shortlisted", "review", "rejected"].map((status, i) => (
              <Button key={`filter-${status}-${i}`}
                variant={statusFilter === status ? "default" : "outline"} size="sm"
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground"}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

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
                {filtered.map((candidate, rowIdx) => (
                  <TableRow key={`row-${candidate.id}-${rowIdx}`}>
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
                        {candidate.skills.slice(0, 3).map((skill, i) => (
                          <Badge key={`${candidate.id}-skill-${i}`} variant="outline" className="text-xs font-normal">{skill}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{candidate.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={candidate.status === "shortlisted" ? "default" : candidate.status === "review" ? "secondary" : "outline"}
                        className={candidate.status === "shortlisted" ? "bg-success text-success-foreground" : candidate.status === "rejected" ? "text-destructive" : ""}
                      >
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8"
                          onClick={() => setShowDetail(candidate.id)} title="View details">
                          <Eye className="size-3.5 text-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8"
                          onClick={() => setStatus(candidate.id, "shortlisted")} title="Shortlist">
                          <ListChecks className="size-3.5 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8"
                          onClick={() => setRejectCandidate(candidate)} title="Reject">
                          <XCircle className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow key="empty-row">
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
    </>
  )
}