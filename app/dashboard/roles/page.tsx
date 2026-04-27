"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus, X, MapPin, Clock, Users, CheckCircle2, Loader2, FileText,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Role = {
  id: string
  title: string
  department: string
  location: string
  experience: string
  applicants: number
  status: "active" | "draft"
  skills: string[]
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [roleTitle, setRoleTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [location, setLocation] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [experience, setExperience] = useState(3)
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Load roles from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    loadRoles()
  }, [])

  async function loadRoles() {
    setLoadingRoles(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("comm_roles")
      .select("*")
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      setRoles(data.map((r: any) => ({
        id: r.id,
        title: r.title || "Untitled",
        department: r.department || "—",
        location: r.location || "Remote",
        experience: r.experience ? `${r.experience}+ years` : "—",
        applicants: r.applicants || 0,
        status: r.status || "active",
        skills: r.skills || [],
      })))
    } else {
      setRoles([])
    }
    setLoadingRoles(false)
  }

  // ── Skill helpers ─────────────────────────────────────────────────────────
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill))

  // ── Reset form ────────────────────────────────────────────────────────────
  function resetForm() {
    setRoleTitle("")
    setDepartment("")
    setLocation("")
    setSkills([])
    setSkillInput("")
    setExperience(3)
    setJdFile(null)
    setSaveError(null)
    setSaved(false)
  }

  // ── Save role to Supabase ─────────────────────────────────────────────────
  async function handleCreateRole() {
    if (!roleTitle.trim()) { setSaveError("Role title is required."); return }
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()

      // Upload JD if provided
      let jdUrl: string | null = null
      if (jdFile) {
        const filePath = `roles/${Date.now()}_${jdFile.name}`
        const { error: uploadError } = await supabase.storage
          .from("jd-files")
          .upload(filePath, jdFile)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("jd-files").getPublicUrl(filePath)
          jdUrl = urlData.publicUrl
        }
      }

      const { data, error } = await supabase
        .from("comm_roles")
        .insert({
          title: roleTitle.trim(),
          department: department.trim() || null,
          location: location.trim() || "Remote",  // default Remote if blank
          experience: experience,
          skills: skills,
          status: "active",
          applicants: 0,
          jd_url: jdUrl,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      if (data) {
        setRoles((prev) => [{
          id: data.id,
          title: data.title,
          department: data.department || "—",
          location: data.location || "Remote",
          experience: data.experience ? `${data.experience}+ years` : "—",
          applicants: 0,
          status: "active",
          skills: data.skills || [],
        }, ...prev])
      }

      setSaved(true)
      resetForm()
      setTimeout(() => {
        setSaved(false)
        setShowCreateForm(false)
      }, 1500)

    } catch (e: any) {
      setSaveError(e.message || "Failed to create role")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage open positions and create new roles.
          </p>
        </div>
        <Button
          onClick={() => { setShowCreateForm(!showCreateForm); resetForm() }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4 mr-1" />
          Create Role
        </Button>
      </div>

      {/* ── Create Role Form ── */}
      {showCreateForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-foreground">Create New Role</CardTitle>
            <button
              onClick={() => { setShowCreateForm(false); resetForm() }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">

            {/* Role Title */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Role Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Senior Product Manager"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>

            {/* Department + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Department</label>
                <Input
                  placeholder="e.g. Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Location
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(defaults to Remote)</span>
                </label>
                <Input
                  placeholder="e.g. Remote, New York, London"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Required Skills</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill and press Enter..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button
                  variant="outline"
                  onClick={addSkill}
                  className="bg-transparent text-foreground shrink-0"
                >
                  Add
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Experience slider */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Minimum Experience:{" "}
                <span className="text-primary font-bold">{experience} years</span>
              </label>
              <input
                type="range" min="0" max="15" value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 yrs</span>
                <span>15 yrs</span>
              </div>
            </div>

            {/* JD Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Job Description
                <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
              </label>
              <div
                className={`rounded-lg border-2 border-dashed p-5 flex flex-col items-center justify-center cursor-pointer transition-colors
                  ${jdFile ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40"}`}
                onClick={() => document.getElementById("jd-upload")?.click()}
              >
                <FileText className={`size-6 mb-2 ${jdFile ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium text-foreground">
                  {jdFile ? jdFile.name : "Click to upload job description"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX or TXT</p>
                <input
                  id="jd-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setJdFile(f)
                    if (f) localStorage.setItem("recruitai_jd_name", f.name)
                  }}
                />
              </div>
              {jdFile && (
                <button
                  onClick={() => setJdFile(null)}
                  className="text-xs text-muted-foreground hover:text-destructive text-left w-fit"
                >
                  Remove file
                </button>
              )}
            </div>

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateRole}
                disabled={saving || !roleTitle.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving
                  ? <><Loader2 className="size-4 mr-1 animate-spin" />Creating...</>
                  : <><Plus className="size-4 mr-1" />Create Role</>
                }
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowCreateForm(false); resetForm() }}
                className="bg-transparent text-foreground"
              >
                Cancel
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-500 font-medium">
                  <CheckCircle2 className="size-4" /> Role created!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Roles List ── */}
      {loadingRoles ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="size-4 animate-spin" /> Loading roles...
        </div>
      ) : roles.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-16 text-center flex flex-col items-center gap-3">
            <Users className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No roles yet. Click{" "}
              <span className="font-medium text-foreground">Create Role</span>{" "}
              to add your first one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="border-border hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{role.title}</h3>
                    <p className="text-sm text-muted-foreground">{role.department}</p>
                  </div>
                  <Badge
                    variant={role.status === "active" ? "default" : "secondary"}
                    className={role.status === "active" ? "bg-success text-success-foreground" : ""}
                  >
                    {role.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {role.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {role.experience}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {role.applicants} applicants
                  </span>
                </div>
                {role.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {role.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}