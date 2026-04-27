"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { activityFeed, roles } from "@/lib/mock-data"
import Link from "next/link"
import {
  Briefcase,
  FileText,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  Users,
  ListChecks,
  CalendarClock,
  Zap,
} from "lucide-react"

const kpiCards = [
  { label: "Active Roles", value: "4", icon: Briefcase, change: "+1 this week" },
  { label: "Resumes Screened Today", value: "129", icon: FileText, change: "+47 in last hour" },
  { label: "Top Matches Found", value: "23", icon: Star, change: "Across all roles" },
  { label: "Hours Saved", value: "14.5", icon: Clock, change: "This week" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your recruiting activity at a glance.
        </p>
      </div>

      {/* AI banner */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-4">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            RecruitAI saved <span className="text-primary font-semibold">14 hours</span> this week.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            129 resumes screened, 23 top matches identified, 4 interviews scheduled.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <kpi.icon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {activityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5 size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {item.type === "screening" && <FileText className="size-4 text-primary" />}
                    {item.type === "shortlist" && <ListChecks className="size-4 text-primary" />}
                    {item.type === "scheduling" && <CalendarClock className="size-4 text-primary" />}
                    {item.type === "role" && <Briefcase className="size-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/dashboard/roles">
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent text-foreground">
                <Briefcase className="size-4 text-primary" />
                Create New Role
                <ArrowRight className="size-3 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/dashboard/candidates">
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent text-foreground">
                <Users className="size-4 text-primary" />
                Review Candidates
                <ArrowRight className="size-3 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/dashboard/shortlist">
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent text-foreground">
                <ListChecks className="size-4 text-primary" />
                View Shortlist
                <ArrowRight className="size-3 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/dashboard/scheduling">
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent text-foreground">
                <CalendarClock className="size-4 text-primary" />
                Schedule Interviews
                <ArrowRight className="size-3 ml-auto text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Roles */}
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-foreground">Active Roles</CardTitle>
          <Link href="/dashboard/roles">
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ArrowRight className="size-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.filter(r => r.status === "active").map((role) => (
              <div key={role.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{role.title}</h3>
                  <Badge variant="secondary" className="text-xs">{role.department}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{role.applicants} applicants</span>
                  <span>{role.shortlisted} shortlisted</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {role.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
