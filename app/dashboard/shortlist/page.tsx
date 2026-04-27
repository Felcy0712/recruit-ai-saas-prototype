"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarClock,
  Star,
  Sparkles,
  Shield,
  MessageSquare,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type ShortlistedCandidate = {
  id: string
  name: string
  email: string
  role: string
  current_company: string
  experience: string
  score: number
  skills: string[]
  gaps: string[]
  recommendation: string
}

export default function ShortlistPage() {
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [tags, setTags] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("comm_candidate")
        .select("*")
        .gte("score", 85)
        .order("score", { ascending: false })

      if (error) {
        console.error("Supabase shortlist error:", error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const mapped: ShortlistedCandidate[] = data.map((c: any) => ({
          id: c.candidate_id || `db_${c.id}`,
          name: (c.candidate_name || "Unknown").trim(),
          email: (c.candidate_email || "").trim(),
          role: (c.current_role || "Candidate").trim(),
          current_company: c.current_company || "",
          experience: c.years_of_experience ? `${c.years_of_experience} yrs` : "—",
          score: typeof c.score === "number" ? c.score : 0,
          skills: Array.isArray(c.strengths)
            ? c.strengths.slice(0, 4).map((s: string) => s.slice(0, 24))
            : [],
          gaps: Array.isArray(c.gaps) ? c.gaps : [],
          recommendation: c.recommendation || "",
        }))

        setCandidates(mapped)
        setOrder(mapped.map((c) => c.id))
      }

      setLoading(false)
    }

    load()
  }, [])

  const orderedCandidates = order
    .map((id) => candidates.find((c) => c.id === id))
    .filter(Boolean) as ShortlistedCandidate[]

  const topTwo = orderedCandidates.slice(0, 2).map((c) => c.name)

  const moveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...order]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setOrder(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === order.length - 1) return
    const newOrder = [...order]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setOrder(newOrder)
  }

  const addTag = (id: string, tag: string) => {
    if (!tag.trim()) return
    setTags((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []).filter((t) => t !== tag), tag],
    }))
  }

  const removeTag = (id: string, tag: string) => {
    setTags((prev) => ({
      ...prev,
      [id]: (prev[id] || []).filter((t) => t !== tag),
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shortlist</h1>
          <p className="text-muted-foreground text-sm mt-1">Rank and compare your top candidates.</p>
        </div>
        <Card className="border-border">
          <CardContent className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading shortlisted candidates...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shortlist</h1>
          <p className="text-muted-foreground text-sm mt-1">Rank and compare your top candidates.</p>
        </div>
        <Card className="border-border">
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            No candidates scored ≥ 85% yet.{" "}
            <Link href="/dashboard/candidates" className="text-primary underline underline-offset-2">
              Go to Candidates
            </Link>{" "}
            to upload a JD and resumes and run AI scoring.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shortlist</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {orderedCandidates.length} candidate{orderedCandidates.length !== 1 ? "s" : ""} ranked · Use arrows to reorder your top picks.
          </p>
        </div>
        <Link href="/dashboard/scheduling">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <CalendarClock className="size-4 mr-1" />
            Schedule Interviews
          </Button>
        </Link>
      </div>

      {topTwo.length > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-4">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              AI recommends interviewing{" "}
              {topTwo.map((name, i) => (
                <span key={name}>
                  <span className="text-primary font-semibold">{name}</span>
                  {i < topTwo.length - 1 && " and "}
                </span>
              ))}{" "}
              first.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based on highest AI scores among all shortlisted candidates.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Shield className="size-3.5 text-primary" />
            <span>Your approval required</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {orderedCandidates.map((candidate, index) => (
          <Card key={candidate.id} className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                        <path d="M6 0L12 8H0L6 0Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === orderedCandidates.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                        <path d="M6 8L0 0H12L6 8Z" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                    <span className={`text-sm font-semibold ${
                      candidate.score >= 85 ? "text-emerald-500"
                      : candidate.score >= 70 ? "text-amber-500"
                      : "text-orange-500"
                    }`}>
                      {candidate.score}%
                    </span>
                    {candidate.recommendation && (
                      <Badge variant="outline" className="text-xs text-primary border-primary/40">
                        {candidate.recommendation}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {candidate.role}
                    {candidate.current_company && ` · ${candidate.current_company}`}
                    {candidate.experience !== "—" && ` · ${candidate.experience}`}
                  </p>
                  {candidate.email && (
                    <p className="text-xs text-muted-foreground">{candidate.email}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs font-normal">
                        {skill}
                      </Badge>
                    ))}
                    {(tags[candidate.id] || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() => removeTag(candidate.id, tag)}
                        title="Click to remove"
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-foreground"
                    onClick={() => {
                      const tag = prompt("Add a tag (e.g. Top pick, Culture fit):")
                      if (tag) addTag(candidate.id, tag)
                    }}
                  >
                    <MessageSquare className="size-3.5 mr-1" />
                    Tag
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Star className="size-4 text-primary" />
            Candidate Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-muted-foreground font-medium">Criteria</th>
                  {orderedCandidates.map((c) => (
                    <th key={c.id} className="text-center py-3 px-4 text-foreground font-medium">
                      {c.name.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["AI Score", "Experience", "Skills Match", "Recommendation", "Gaps"].map((criteria) => (
                  <tr key={criteria} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{criteria}</td>
                    {orderedCandidates.map((c) => (
                      <td key={c.id} className="text-center py-3 px-4">
                        {criteria === "AI Score" && (
                          <span className={`font-semibold ${
                            c.score >= 85 ? "text-emerald-500"
                            : c.score >= 70 ? "text-amber-500"
                            : "text-orange-500"
                          }`}>
                            {c.score}%
                          </span>
                        )}
                        {criteria === "Experience" && (
                          <span className="text-foreground">{c.experience}</span>
                        )}
                        {criteria === "Skills Match" && (
                          <Badge variant="secondary" className="text-xs">
                            {c.skills.length} matched
                          </Badge>
                        )}
                        {criteria === "Recommendation" && (
                          <span className={`text-xs font-medium ${
                            c.recommendation === "Strong Yes" ? "text-emerald-500"
                            : c.recommendation === "Yes" ? "text-amber-500"
                            : c.recommendation === "Maybe" ? "text-orange-500"
                            : "text-red-500"
                          }`}>
                            {c.recommendation || "—"}
                          </span>
                        )}
                        {criteria === "Gaps" && (
                          <span className="text-xs text-muted-foreground">
                            {c.gaps.length} gap{c.gaps.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}