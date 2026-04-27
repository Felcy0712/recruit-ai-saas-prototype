"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RecruitLogo } from "@/components/recruit-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import bcrypt from "bcryptjs"
import {
  Brain,
  ListChecks,
  MessageSquare,
  CalendarClock,
  Play,
  Clock,
  TrendingDown,
  Zap,
  Users,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react"

const slides = [
  { id: "hero", label: "Overview" },
  { id: "video", label: "Why Us" },
  { id: "why", label: "Why RecruitAI" },
  { id: "impact", label: "Impact" },
]

export default function LandingPage() {
  const { setUser } = useUser()
  const router = useRouter()
  const [activeSlide, setActiveSlide] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToSlide = useCallback((index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // Auto-scroll every 6 seconds
  useEffect(() => {
    if (videoPlaying) return
    autoScrollRef.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % slides.length
        scrollToSlide(next)
        return next
      })
    }, 6000)

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [scrollToSlide, videoPlaying])

  // Intersection observer for active slide detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex((ref) => ref === entry.target)
            if (index !== -1) {
              setActiveSlide(index)
              if (autoScrollRef.current) clearInterval(autoScrollRef.current)
              autoScrollRef.current = setInterval(() => {
                setActiveSlide((prev) => {
                  const next = (prev + 1) % slides.length
                  scrollToSlide(next)
                  return next
                })
              }, 6000)
            }
          }
        }
      },
      { threshold: 0.5 }
    )

    for (const ref of slideRefs.current) {
      if (ref) observer.observe(ref)
    }

    return () => observer.disconnect()
  }, [scrollToSlide])

  const handleNavClick = (index: number) => {
    setActiveSlide(index)
    scrollToSlide(index)
  }

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    if (!email.trim()) {
      setLoginError("Please enter your email.")
      return
    }
    if (!password.trim()) {
      setLoginError("Please enter your password.")
      return
    }

    setLoginLoading(true)
    try {
      const supabase = createClient()

      const { data: user, error: dbError } = await supabase
  .from("comm_user")
  .select("*")
  .eq("email", email.toLowerCase().trim())
  .maybeSingle()



if (dbError || !user) {
  setLoginError("Unknown user. Please create an account first.")
  return
}
       
       console.log("User found:", user)
     // Plain text password comparison (no bcrypt since password is not hashed)
      const passwordValid = user.password === password

     if (!passwordValid) {
     setLoginError("Invalid email or password.")
     return
    }

     // ✅ Use correct column names from your table
     setUser({ name: user.username, email: user.email, company: user.company || "" })
     router.push("/dashboard")
    }
      catch (err) {
      console.error("Sign-in error:", err)
      setLoginError("Something went wrong. Please try again.")
     } finally {
       setLoginLoading(false)
  }
 }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14">
          <RecruitLogo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-foreground">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex pt-14 min-h-screen">
        {/* Left vertical navigation */}
        <nav className="hidden lg:flex fixed left-0 top-14 bottom-0 w-14 flex-col items-center justify-center gap-2 border-r border-border bg-background z-40">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => handleNavClick(i)}
              className="group relative flex items-center justify-center"
              aria-label={slide.label}
            >
              <div
                className={`size-2.5 rounded-full transition-all duration-300 ${
                  activeSlide === i
                    ? "bg-primary scale-125"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
              <span className="absolute left-8 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {slide.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Left slide content */}
        <div
          ref={containerRef}
          className={`flex-1 lg:ml-14 lg:mr-[400px] ${
            videoPlaying ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {/* Slide 1: Hero */}
          <div
            ref={(el) => { slideRefs.current[0] = el }}
            className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center px-6 md:px-12 lg:px-16"
          >
            <Badge variant="secondary" className="mb-6 w-fit text-secondary-foreground">
              <Zap className="size-3 mr-1" />
              AI-Powered Recruiting
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance leading-tight">
              The AI Co-Pilot{" "}
              <span className="text-primary">for Recruiting.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed text-pretty">
              RecruitAI turns hiring chaos into clarity. Instant shortlists. Automated scheduling. Human-approved decisions.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Start Free Trial
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={() => handleNavClick(1)} className="bg-transparent">
                Why us
                <Play className="size-4 ml-1" />
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <span>Human-in-the-loop</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>500+ teams</span>
              </div>
            </div>
          </div>

          {/* Slide 2: Video */}
          <div
            ref={(el) => { slideRefs.current[1] = el }}
            className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center px-6 md:px-12 lg:px-16"
          >
            <div className="relative rounded-xl border border-border bg-card overflow-hidden aspect-video max-w-3xl">
              <video
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                playsInline
                onPlay={() => setVideoPlaying(true)}
                onPause={() => setVideoPlaying(false)}
                onEnded={() => setVideoPlaying(false)}
              >
                <source src="/videos/RecruitAI_video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Slide 3: Why RecruitAI */}
          <div
            ref={(el) => { slideRefs.current[2] = el }}
            className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center px-6 md:px-12 lg:px-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              Why RecruitAI
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg">
              Four pillars that transform how you hire.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              {[
                { icon: Brain, title: "AI Resume Ranking", desc: "Instantly score and rank every applicant based on your criteria." },
                { icon: ListChecks, title: "Smart Shortlisting", desc: "Auto-generate shortlists with transparent AI reasoning." },
                { icon: MessageSquare, title: "Auto Communication", desc: "Send personalized updates to candidates automatically." },
                { icon: CalendarClock, title: "Auto Scheduling", desc: "Eliminate scheduling back-and-forth with smart calendar matching." },
              ].map((item) => (
                <Card key={item.title} className="border-border bg-card">
                  <CardContent className="pt-6">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="size-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-3 rounded-lg bg-secondary p-4 max-w-2xl">
              <Shield className="size-5 text-primary shrink-0" />
              <p className="text-sm text-secondary-foreground">
                <span className="font-medium">Human-in-the-loop design.</span>{" "}
                AI recommends. You decide. Override anytime.
              </p>
            </div>
          </div>

          {/* Slide 4: Impact */}
          <div
            ref={(el) => { slideRefs.current[3] = el }}
            className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center px-6 md:px-12 lg:px-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-balance">
              Real impact, measurable results.
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
              {[
                { icon: Clock, value: "24h", label: "Shortlist speed", desc: "From days to hours" },
                { icon: TrendingDown, value: "10+", label: "Days saved", desc: "Per hiring cycle" },
                { icon: Zap, value: "60%", label: "Admin reduction", desc: "Less manual work" },
                { icon: Users, value: "85%", label: "Activation rate", desc: "Teams that stay" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <stat.icon className="size-5 text-primary mb-3" />
                  <span className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-sm font-medium text-foreground mt-1">{stat.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{stat.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started Free
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right sticky sign-in panel ── */}
        <div className="hidden lg:flex fixed right-0 top-14 bottom-0 w-[400px] border-l border-border bg-card flex-col justify-center px-10">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-bold text-card-foreground">Sign in</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Welcome back to RecruitAI</p>
          </CardHeader>
          <CardContent className="px-0">
            <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
              {/* Email */}
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
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label htmlFor="landing-password" className="text-sm font-medium text-card-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="landing-password"
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

              {/* Error message */}
              {loginError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {loginError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loginLoading}
              >
                {loginLoading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                New here?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  )
}