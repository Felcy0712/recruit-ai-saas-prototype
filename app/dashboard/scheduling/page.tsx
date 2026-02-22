"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarClock, Mail, Check, AlertCircle, Send, Shield,
  User, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const LS_SCHEDULE_KEY = "recruitai_schedule_v1"
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"]

type ShortlistedCandidate = {
  id: string
  name: string
  email: string
  role: string
  score: number
}

type ScheduledSlot = {
  candidateId: string
  candidateName: string
  candidateEmail: string
  date: string
  day: string
  time: string
  status: "confirmed" | "pending"
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getWeekDates(monday: Date): Record<string, string> {
  const map: Record<string, string> = {}
  WEEK_DAYS.forEach((day, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    map[day] = d.toISOString().split("T")[0]
  })
  return map
}

function formatWeekLabel(monday: Date): string {
  return `Week of ${monday.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })}`
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200"
  if (score >= 70) return "text-amber-600 bg-amber-50 border-amber-200"
  return "text-red-600 bg-red-50 border-red-200"
}

export default function SchedulingPage() {
  const { user } = useUser()

  const [shortlisted, setShortlisted] = useState<ShortlistedCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState<ScheduledSlot[]>([])
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()))
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [previewSlot, setPreviewSlot] = useState<ScheduledSlot | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState("")

  const recruiterName = user?.name || "Recruiter"
  const recruiterEmail = (user as any)?.email || "recruiter@example.com"
  const recruiterCompany = user?.company || "Acme Inc"
  const weekDates = getWeekDates(weekStart)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("comm_candidate")
        .select("*")
        .gte("score", 85)
        .order("score", { ascending: false })

      if (!error && data && data.length > 0) {
        setShortlisted(
          data.map((c: any) => ({
            id: c.candidate_id || `db_${c.id}`,
            name: (c.candidate_name || "Unknown").trim(),
            email: (c.candidate_email || "").trim(),
            role: (c.current_role || "Candidate").trim(),
            score: typeof c.score === "number" ? c.score : 0,
          }))
        )
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SCHEDULE_KEY)
      if (raw) setSchedule(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const saveSchedule = (updated: ScheduledSlot[]) => {
    setSchedule(updated)
    localStorage.setItem(LS_SCHEDULE_KEY, JSON.stringify(updated))
  }

  const getSlot = (day: string, time: string) =>
    schedule.find((s) => s.day === day && s.time === time && s.date === weekDates[day])

  const bookSlot = (day: string, time: string) => {
    if (!selectedCandidate) return
    if (getSlot(day, time)) return
    const newSlot: ScheduledSlot = {
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      candidateEmail: selectedCandidate.email,
      date: weekDates[day],
      day,
      time,
      status: "pending",
    }
    saveSchedule([...schedule, newSlot])
    setSelectedCandidate(null)
  }

  const confirmSlot = (day: string, time: string) => {
    saveSchedule(schedule.map((s) =>
      s.day === day && s.time === time && s.date === weekDates[day]
        ? { ...s, status: "confirmed" }
        : s
    ))
  }

  const removeSlot = (day: string, time: string) => {
    saveSchedule(schedule.filter(
      (s) => !(s.day === day && s.time === time && s.date === weekDates[day])
    ))
    if (previewSlot?.day === day && previewSlot?.time === time) {
      setShowEmailPreview(false)
      setPreviewSlot(null)
    }
  }

  const upcomingInterviews = [...schedule]
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

  const emailSubject = previewSlot ? `Interview Invitation for ${previewSlot.candidateName}` : ""
  const emailBody = previewSlot
   // ? `Hi ${previewSlot.candidateName.split(" ")[0]},\r\n\r\nWe were impressed by your application and would like to invite you for an interview.\n\nProposed slot: ${previewSlot.day} ${previewSlot.time} (${previewSlot.date})\n\nPlease confirm your availability.\n\nBest regards,\n${recruiterName}\n${recruiterCompany}`
   ? `Hi ${previewSlot.candidateName.split(" ")[0]},<br><br>We were impressed by your application and would like to invite you for an interview.<br><br>Proposed slot: ${previewSlot.day} ${previewSlot.time} (${previewSlot.date})<br><br>Please confirm your availability.<br><br>Best regards,<br>${recruiterName}<br>${recruiterCompany}` 
   : ""

     const emailBodyPreview = previewSlot
    ? `Hi ${previewSlot.candidateName.split(" ")[0]},\r\n\r\nWe were impressed by your application and would like to invite you for an interview.\n\nProposed slot: ${previewSlot.day} ${previewSlot.time} (${previewSlot.date})\n\nPlease confirm your availability.\n\nBest regards,\n${recruiterName}\n${recruiterCompany}`
   //? `Hi ${previewSlot.candidateName.split(" ")[0]},<br><br>We were impressed by your application and would like to invite you for an interview.<br><br>Proposed slot: ${previewSlot.day} ${previewSlot.time} (${previewSlot.date})<br><br>Please confirm your availability.<br><br>Best regards,<br>${recruiterName}<br>${recruiterCompany}` 
   : ""

  async function handleSendInvite() {
    if (!previewSlot) return
    setSending(true)
    setSent(false)
    setSendError("")
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: previewSlot.candidateId,
          candidate_name: previewSlot.candidateName,
          candidate_email: previewSlot.candidateEmail,
          recruiter_name: recruiterName,
          recruiter_email: recruiterEmail,
          company: recruiterCompany,
          time_slot: `${previewSlot.day} ${previewSlot.time}`,
          date: previewSlot.date,
          email_subject: emailSubject,
          email_body: emailBody,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSendError(data?.error || "Invite failed")
      } else {
        setSent(true)
        confirmSlot(previewSlot.day, previewSlot.time)
      }
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : "Network error")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scheduling</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Schedule interviews for shortlisted candidates.
        </p>
      </div>

      {/* Human approval notice */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-4">
        <Shield className="size-5 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Human approval required.</span>{" "}
          Scheduling is only available for candidates that have been approved on the shortlist.
        </p>
      </div>

      {/* ── Candidate selector — improved readability ── */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading shortlisted candidates...
        </div>
      ) : shortlisted.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Book interview slot for:</p>
          <div className="flex flex-wrap gap-3">
            {shortlisted.map((c) => {
              const isSelected = selectedCandidate?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCandidate(isSelected ? null : c)
                    setShowEmailPreview(false)
                    setPreviewSlot(null)
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all
                    ${isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className={`
                    size-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                  `}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + Role */}
                  <div className="text-left">
                    <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">{c.role}</p>
                  </div>

                  {/* Score badge */}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor(c.score)}`}>
                    {c.score}%
                  </span>
                </button>
              )
            })}
          </div>

          {selectedCandidate && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
              <CalendarClock className="size-4 shrink-0" />
              Click any available slot on the calendar to book for{" "}
              <span className="font-semibold">{selectedCandidate.name}</span>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No shortlisted candidates with score ≥ 85% found.{" "}
            <a href="/dashboard/candidates" className="text-primary underline underline-offset-2">
              Go to Candidates
            </a>{" "}
            to score and shortlist candidates first.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              {formatWeekLabel(weekStart)}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }}>
                <ChevronLeft className="size-4 text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }}>
                <ChevronRight className="size-4 text-foreground" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-px min-w-[600px]">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-foreground pb-3 border-b border-border">
                    {day}
                    <p className="text-[10px] text-muted-foreground font-normal">{weekDates[day]}</p>
                  </div>
                ))}
                {WEEK_DAYS.map((day) => (
                  <div key={`cell-${day}`} className="min-h-[200px] border-r border-border last:border-r-0 p-2 flex flex-col gap-1.5 pt-3">
                    {TIME_SLOTS.map((time) => {
                      const slot = getSlot(day, time)
                      const isBooked = !!slot
                      const isConfirmed = slot?.status === "confirmed"
                      const isPending = slot?.status === "pending"
                      const isPreview = previewSlot?.day === day && previewSlot?.time === time
                      return (
                        <div
                          key={time}
                          onClick={() => {
                            if (isBooked) {
                              setPreviewSlot(slot)
                              setShowEmailPreview(true)
                              setSent(false)
                              setSendError("")
                            } else if (selectedCandidate) {
                              bookSlot(day, time)
                            }
                          }}
                          className={`
                            rounded-md p-2 text-xs cursor-pointer transition-colors
                            ${isConfirmed
                              ? "bg-success/10 border border-success/20 text-success"
                              : isPending
                              ? "bg-warning/10 border border-warning/20 text-warning"
                              : selectedCandidate
                              ? "bg-muted border border-dashed border-primary/40 text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                              : "bg-muted border border-border text-muted-foreground"
                            }
                            ${isPreview ? "ring-2 ring-primary" : ""}
                          `}
                        >
                          <span className="font-medium">{time}</span>
                          {isBooked ? (
                            <>
                              <p className="mt-0.5 text-foreground font-medium truncate">
                                {slot.candidateName.split(" ")[0]}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {slot.status}
                                </Badge>
                                <div className="flex gap-1">
                                  {isPending && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); confirmSlot(day, time) }}
                                      className="text-success hover:text-success/80 text-[10px] font-bold"
                                      title="Confirm"
                                    >✓</button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeSlot(day, time) }}
                                    className="text-muted-foreground hover:text-destructive text-[10px]"
                                    title="Remove"
                                  >×</button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="mt-0.5 text-[10px]">
                              {selectedCandidate ? "Click to book" : "Available"}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">

          {/* Upcoming interviews */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-sm">Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {upcomingInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interviews scheduled yet.
                </p>
              ) : (
                upcomingInterviews.map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => {
                      setPreviewSlot(slot)
                      setShowEmailPreview(true)
                      setSent(false)
                      setSendError("")
                    }}
                  >
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      {slot.candidateName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{slot.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{slot.date} at {slot.time}</p>
                    </div>
                    {slot.status === "confirmed"
                      ? <Check className="size-4 text-success shrink-0" />
                      : <AlertCircle className="size-4 text-warning shrink-0" />
                    }
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Email preview */}
          {showEmailPreview && previewSlot && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  Email Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">To:</span>{" "}
                    {previewSlot.candidateName}
                    {previewSlot.candidateEmail && ` (${previewSlot.candidateEmail})`}
                  </p>
                  <p className="text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">Time:</span>{" "}
                    {previewSlot.day} {previewSlot.time} · {previewSlot.date}
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <span className="font-medium text-foreground">Subject:</span>{" "}
                    {emailSubject}
                  </p>
                  <div className="border-t border-border pt-3 text-muted-foreground leading-relaxed whitespace-pre-line text-xs">
                    {emailBodyPreview}
                  </div>
                </div>
                {sendError && <p className="text-xs text-destructive mt-3">{sendError}</p>}
                <Button
                  onClick={handleSendInvite}
                  disabled={sending || sent}
                  className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-4 mr-1" />
                  {sending ? "Sending..." : sent ? "Invite Sent ✅" : "Send Interview Invite"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}