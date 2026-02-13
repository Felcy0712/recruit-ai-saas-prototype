"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { candidates } from "@/lib/mock-data"
import {
  GripVertical,
  CalendarClock,
  Star,
  X,
  Sparkles,
  Shield,
  ArrowRight,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

export default function ShortlistPage() {
  const shortlisted = candidates.filter((c) => c.status === "shortlisted")
  const [order, setOrder] = useState(shortlisted.map((c) => c.id))
  const [tags, setTags] = useState<Record<string, string[]>>({
    "1": ["Top pick", "Culture fit"],
    "2": ["Strong technical"],
    "8": ["Design lead potential"],
  })

  const orderedCandidates = order
    .map((id) => shortlisted.find((c) => c.id === id))
    .filter(Boolean) as typeof shortlisted

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shortlist</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rank and compare your top candidates.
          </p>
        </div>
        <Link href="/dashboard/scheduling">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <CalendarClock className="size-4 mr-1" />
            Schedule Interviews
          </Button>
        </Link>
      </div>

      {/* AI recommendation */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-4">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            AI recommends interviewing <span className="text-primary font-semibold">Sarah Chen</span> and <span className="text-primary font-semibold">Marcus Johnson</span> first.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Both scored 90%+ and have all required skills.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="size-3.5 text-primary" />
          <span>Your approval required</span>
        </div>
      </div>

      {/* Shortlist ranking */}
      <div className="flex flex-col gap-3">
        {orderedCandidates.map((candidate, index) => (
          <Card key={candidate.id} className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4">
                {/* Rank & drag handle */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor"><path d="M6 0L12 8H0L6 0Z"/></svg>
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={index === orderedCandidates.length - 1}
                      aria-label="Move down"
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor"><path d="M6 8L0 0H12L6 8Z"/></svg>
                    </button>
                  </div>
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                    {index + 1}
                  </span>
                </div>

                {/* Candidate info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                    <span className={`text-sm font-semibold ${candidate.score >= 85 ? "text-success" : "text-warning"}`}>
                      {candidate.score}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{candidate.role} &middot; {candidate.experience}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs font-normal">
                        {skill}
                      </Badge>
                    ))}
                    {(tags[candidate.id] || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent text-foreground hidden sm:flex">
                    <MessageSquare className="size-3.5 mr-1" />
                    Notes
                  </Button>
                  <Link href="/dashboard/scheduling">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <CalendarClock className="size-3.5 mr-1" />
                      Schedule
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison view */}
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
                    <th key={c.id} className="text-center py-3 px-4 text-foreground font-medium">{c.name.split(" ")[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["AI Score", "Experience", "Skills Match", "Culture Fit"].map((criteria) => (
                  <tr key={criteria} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{criteria}</td>
                    {orderedCandidates.map((c) => (
                      <td key={c.id} className="text-center py-3 px-4">
                        {criteria === "AI Score" && <span className="font-semibold text-foreground">{c.score}%</span>}
                        {criteria === "Experience" && <span className="text-foreground">{c.experience}</span>}
                        {criteria === "Skills Match" && (
                          <Badge variant="secondary" className="text-xs">
                            {c.skills.length}/{c.skills.length + 1}
                          </Badge>
                        )}
                        {criteria === "Culture Fit" && (
                          <span className="text-success text-xs font-medium">Strong</span>
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
