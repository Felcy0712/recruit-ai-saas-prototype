"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import bcrypt from "bcryptjs"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Query comm_user table for matching email
      const { data: user, error: dbError } = await supabase
        .from("comm_user")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle()

        console.log(email.toLowerCase());
      if (dbError || !user) {
        setError("Invalid email or password.")
        return
      }

      // Validate password — supports both bcrypt hashes and plain text (dev only)
      let passwordValid = false

      if (user.password?.startsWith("$2")) {
        // bcrypt hash
        passwordValid = await bcrypt.compare(password, user.password)
      } else {
        // Plain text comparison (not recommended for production)
        passwordValid = user.password === password
      }

      if (!passwordValid) {
        setError("Invalid email or password.")
        return
      }

      // Optionally store session info (e.g. in localStorage or a cookie)
      // For a full auth flow you'd set a session here
      localStorage.setItem("user_id", user.id)
      localStorage.setItem("user_email", user.email)
      localStorage.setItem("company", user.company || "")


      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Welcome back.
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Sign in to your RecruitAI account.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
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

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
          {loading ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/auth/signup" className="text-primary hover:underline font-medium">
          Create an account
        </Link>
      </p>
    </div>
  )
}