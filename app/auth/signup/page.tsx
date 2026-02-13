"use client"

"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"


export default function SignUpPage() {
  const router = useRouter()
  const { setUser } = useUser()
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [error, setError] = useState("")
  const [loginError, setLoginError] = useState("")



  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  setError("")

  if (!name.trim() || !email.trim()) {
    setError("Please enter name and email.")
    return
  }

  const raw = localStorage.getItem("recruitai-users")
  const users: Array<{ name: string; email: string; company: string }> =
    raw ? JSON.parse(raw) : []

  const exists = users.some(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  )

  if (exists) {
    setError("Account already exists. Please log in.")
    return
  }

  const newUser = {
    name: name.trim(),
    email: email.trim(),
    company: company.trim(),
  }

  users.push(newUser)
  localStorage.setItem("recruitai-users", JSON.stringify(users))

  // login immediately
  setUser(newUser)
  localStorage.setItem("recruitai-user", JSON.stringify(newUser))

  router.push("/dashboard")
}

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Start hiring faster today.
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Create your free account to get started.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
    required
  />
</div>


        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
         <label htmlFor="landing-email" className="text-sm font-medium text-card-foreground">
         Work email
          </label>
           <Input
            id="landing-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
         {loginError && (
            <p className="text-sm text-destructive">{loginError}</p>)}
        </div>


        <Button type="submit" className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  )
}
