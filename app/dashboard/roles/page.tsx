"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { roles } from "@/lib/mock-data"
import {
  Plus,
  X,
  Upload,
  Sparkles,
  MapPin,
  Clock,
  Users,
} from "lucide-react"

export default function RolesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [experience, setExperience] = useState(3)

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }
  
  const [jdFile, setJdFile] = useState<File | null>(null)

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
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4 mr-1" />
          Create Role
        </Button>
      </div>

      {/* Create Role Form */}
      {showCreateForm && (
        <Card className="border-primary/20 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Create New Role</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Role Title</label>
              <Input placeholder="e.g. Senior Product Manager" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Required Skills</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button variant="outline" onClick={addSkill} className="bg-transparent text-foreground">Add</Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-destructive" aria-label={`Remove ${skill}`}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Minimum Experience: {experience} years
              </label>
              <input
                type="range"
                min="0"
                max="15"
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

          {/* <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Job Description</label>
              <div className="rounded-lg border-2 border-dashed border-border p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="size-8 mb-2" />
                <p className="text-sm font-medium">Upload job description</p>
                <p className="text-xs mt-1">PDF, DOCX, or TXT up to 10MB</p>
              </div>
            </div>*/}

            <div className="flex flex-col gap-2">
             <label className="text-sm font-medium text-foreground">Job Description</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                const f = e.target.files?.[0] || null
                setJdFile(f)
                if (f) {
                      // store JD file in memory for later step (Candidates page)
                localStorage.setItem("recruitai_jd_name", f.name)
              }}}
                className="text-sm text-muted-foreground"
                   />
                  {jdFile && (
                  <p className="text-xs text-muted-foreground"> Selected: <span className="text-foreground">{jdFile.name}</span>
                 </p>
                  )}
            </div>
            {/*<Button className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">
              <Sparkles className="size-4 mr-1" />
              Generate Screening Criteria
            </Button>*/}
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="border-border">
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
                  <MapPin className="size-3.5" />
                  {role.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {role.experience}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {role.applicants} applicants
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
