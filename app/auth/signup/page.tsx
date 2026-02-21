"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import bcrypt from "bcryptjs"

export default function SignUpPage() {
  const router = useRouter()
  const { setUser } = useUser()
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [company, setCompany] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Check if email already exists in comm_user
      const { data: existing } = await supabase
        .from("comm_user")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle()

      if (existing) {
        setError("An account with this email already exists. Please log in.")
        return
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10)

      // Insert new user into comm_user
     const { data: newUser, error: insertError } = await supabase
      .from("comm_user")
      .insert({
        username: name.trim(),
        first_name: name.trim(),
        last_name: "",
        email: email.toLowerCase().trim(),
        password: password,
        active: true,
       status: "N",
       login_count: 0,
    })
     .select()
     .maybeSingle()

    if (insertError || !newUser) {
     console.error("Insert error:", JSON.stringify(insertError))
     setError("Failed to create account. Please try again.")
     return
    }

    setUser({ name: newUser.username, email: newUser.email })
    router.push("/dashboard")
    } catch (err) {
      console.error("Signup error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
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
        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Work Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Work email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Company (optional) */}
        <div className="flex flex-col gap-2">
          <label htmlFor="company" className="text-sm font-medium text-foreground">
            Company <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            id="company"
            type="text"
            placeholder="Your company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account"}
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