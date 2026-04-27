"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { User, Building, Bell, CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type UserProfile = {
  id: number
  first_name: string
  last_name: string
  email: string
  company: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [savedCompany, setSavedCompany] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [companyError, setCompanyError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        const supabase = createClient()
        const stored = localStorage.getItem("recruitai-user")
        if (!stored) return
        const { email: storedEmail } = JSON.parse(stored)

        const { data } = await supabase
          .from("comm_user")
          .select("id, first_name, last_name, email, company")
          .eq("email", storedEmail)
          .maybeSingle()

        if (data) {
          setProfile(data)
          setName(`${data.first_name || ""} ${data.last_name || ""}`.trim())
          setEmail(data.email || "")
          setCompany(data.company || "")
        }
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleSaveProfile() {
    if (!profile) return
    setSavingProfile(true)
    setProfileError(null)
    try {
      const supabase = createClient()
      const parts = name.trim().split(" ")
      const first_name = parts[0] || ""
      const last_name = parts.slice(1).join(" ") || ""

      const { error } = await supabase
        .from("comm_user")
        .update({ first_name, last_name, email })
        .eq("id", profile.id)

      if (error) throw new Error(error.message)

      localStorage.setItem("recruitai-user", JSON.stringify({ email }))
      setProfile((prev) => prev ? { ...prev, first_name, last_name, email, company } : prev)
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 3000)
    } catch (e: any) {
      setProfileError(e.message || "Failed to save profile")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveCompany() {
    if (!profile) return
    setSavingCompany(true)
    setCompanyError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("comm_user")
        .update({ company })
        .eq("id", profile.id)

      if (error) throw new Error(error.message)

      setProfile((prev) => prev ? { ...prev, company } : prev)
      setSavedCompany(true)
      setTimeout(() => setSavedCompany(false), 3000)
    } catch (e: any) {
      setCompanyError(e.message || "Failed to save company")
    } finally {
      setSavingCompany(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences.</p>
      </div>

      {/* ── Profile ── */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="size-4 text-primary" /> Profile
          </CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" type="email" />
          </div>
          {profileError && <p className="text-xs text-destructive">{profileError}</p>}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || !profile}
              className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {savingProfile ? <><Loader2 className="size-4 mr-1 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
            {savedProfile && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-500 font-medium">
                <CheckCircle2 className="size-4" /> Saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Company ── */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Building className="size-4 text-primary" /> Company
          </CardTitle>
          <CardDescription>Your organization details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Company Name</label>
            <Input placeholder="Your company name" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Plan</label>
            <Badge className="bg-primary text-primary-foreground">Pro</Badge>
          </div>
          {companyError && <p className="text-xs text-destructive">{companyError}</p>}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveCompany}
              disabled={savingCompany || !profile}
              className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {savingCompany ? <><Loader2 className="size-4 mr-1 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
            {savedCompany && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-500 font-medium">
                <CheckCircle2 className="size-4" /> Saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Notifications ── */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bell className="size-4 text-primary" /> Notifications
          </CardTitle>
          <CardDescription>Manage how you receive updates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {["New candidate matches", "Shortlist updates", "Interview confirmations", "Weekly digest"].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item}</span>
              <input type="checkbox" defaultChecked className="accent-primary size-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}