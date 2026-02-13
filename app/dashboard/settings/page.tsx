"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Building, Bell, Shield } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { useEffect, useState } from "react"


export default function SettingsPage() {
  const { user, setUser } = useUser()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")

  const handleSave = () => {
  const updated = {
    name,
    email,
    company,
  }

  setUser(updated)
}

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="size-4 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input 
             value={name}
             onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input
             value={email}
             onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button  onClick={handleSave}
           className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Company */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Building className="size-4 text-primary" />
            Company
          </CardTitle>
          <CardDescription>Your organization details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Company Name</label>
            <Input
             placeholder="Your company name"
             value={company}
             onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Plan</label>
            <Badge className="bg-primary text-primary-foreground">Pro</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Notifications
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
