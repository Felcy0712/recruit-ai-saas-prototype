"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { schedulingSlots } from "@/lib/mock-data"
import {
  CalendarClock,
  Clock,
  Mail,
  Check,
  AlertCircle,
  Send,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]

const calendarSlots: Record<string, Record<string, { candidate: string; status: string } | null>> = {
  "Mon": { "9:00 AM": { candidate: "Sarah Chen", status: "confirmed" }, "2:00 PM": null },
  "Tue": { "10:00 AM": null, "3:00 PM": null },
  "Wed": { "10:00 AM": { candidate: "Marcus Johnson", status: "pending" }, "11:00 AM": null, "2:00 PM": { candidate: "Alex Thompson", status: "confirmed" } },
  "Thu": { "9:00 AM": null, "11:00 AM": { candidate: "Emily Rodriguez", status: "pending" }, "3:00 PM": null },
  "Fri": { "10:00 AM": null, "1:00 PM": null },
}

export default function SchedulingPage() {
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const { user } = useUser()
  const [company, setCompany] = useState("")


  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar view */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              Week of February 10, 2026
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8">
                <ChevronLeft className="size-4 text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8">
                <ChevronRight className="size-4 text-foreground" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-px min-w-[600px]">
                {/* Header */}
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-foreground pb-3 border-b border-border">
                    {day}
                  </div>
                ))}

                {/* Calendar cells */}
                {weekDays.map((day) => (
                  <div key={`cell-${day}`} className="min-h-[200px] border-r border-border last:border-r-0 p-2 flex flex-col gap-1.5">
                    {calendarSlots[day] && Object.entries(calendarSlots[day]).map(([time, slot]) => (
                      <div
                        key={`${day}-${time}`}
                        className={`rounded-md p-2 text-xs cursor-pointer transition-colors ${
                          slot
                            ? slot.status === "confirmed"
                              ? "bg-success/10 border border-success/20 text-success"
                              : "bg-warning/10 border border-warning/20 text-warning"
                            : "bg-muted border border-border text-muted-foreground hover:border-primary/40"
                        }`}
                        onClick={() => {
                          if (slot) {
                            setSelectedCandidate(slot.candidate)
                            setShowEmailPreview(true)
                          }
                        }}
                      >
                        <span className="font-medium">{time}</span>
                        {slot && (
                          <p className="mt-0.5 text-foreground font-medium">{slot.candidate}</p>
                        )}
                        {slot && (
                          <Badge variant="outline" className="mt-1 text-[10px] h-4">
                            {slot.status}
                          </Badge>
                        )}
                        {!slot && <p className="mt-0.5">Available</p>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Scheduled interviews */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-sm">Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {schedulingSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{slot.candidate}</p>
                    <p className="text-xs text-muted-foreground">{slot.date} at {slot.time}</p>
                  </div>
                  {slot.status === "confirmed" ? (
                    <Check className="size-4 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-warning shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email preview */}
          {showEmailPreview && (
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
                    <span className="font-medium text-foreground">To:</span> {selectedCandidate}
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <span className="font-medium text-foreground">Subject:</span> Interview Invitation - Senior Frontend Engineer
                  </p>
                  <div className="border-t border-border pt-3 text-muted-foreground leading-relaxed">
                    <p>Hi {selectedCandidate?.split(" ")[0]},</p>
                    <p className="mt-2">
                      We were impressed by your application and would like to invite you for an interview for the Senior Frontend Engineer position at Acme Corp.
                    </p>
                    <p className="mt-2">
                      Please select a time that works for you from our available slots.
                    </p>
                    <p className="mt-2">Best regards,<br />{user?.name?.split(" ")[0] ?? ""}<br />
                    {user?.company ?? ""}</p>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Send className="size-4 mr-1" />
                  Send Interview Invite
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
