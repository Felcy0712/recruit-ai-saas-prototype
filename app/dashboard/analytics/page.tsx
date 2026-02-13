"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { analyticsData } from "@/lib/mock-data"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  BarChart3,
  Clock,
  TrendingDown,
  Zap,
  FileText,
} from "lucide-react"

const chartConfig = {
  count: {
    label: "Resumes",
    color: "var(--color-chart-1)",
  },
  hours: {
    label: "Hours Saved",
    color: "var(--color-chart-2)",
  },
  days: {
    label: "Days to Hire",
    color: "var(--color-chart-3)",
  },
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your recruiting performance and AI impact.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Screened", value: "1,640", change: "+185 this month", icon: FileText, color: "text-primary" },
          { label: "Time-to-Shortlist", value: "24h", change: "Down from 5 days", icon: Clock, color: "text-success" },
          { label: "Hours Saved", value: "322", change: "Since September", icon: Zap, color: "text-warning" },
          { label: "Drop-off Reduction", value: "38%", change: "Candidate retention up", icon: TrendingDown, color: "text-primary" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <kpi.icon className={`size-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumes Screened */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Resumes Screened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={analyticsData.resumesScreened}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Time Saved */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Hours Saved Per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={analyticsData.timeSaved}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-hours)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-hours)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--color-hours)"
                  fill="url(#fillHours)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hiring Speed */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingDown className="size-4 text-primary" />
              Hiring Speed Improvement (Days to Hire)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={analyticsData.hiringSpeed}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="days"
                  stroke="var(--color-days)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-days)" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
