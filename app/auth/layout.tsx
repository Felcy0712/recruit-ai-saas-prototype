import type React from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { RecruitLogo } from "@/components/recruit-logo"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12">
        <Link href="/">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="7" className="fill-primary-foreground" />
              <path d="M8 16.5C8 16.5 9.5 14 14 14C14 14 10.5 12 9 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
              <path d="M20 16.5C20 16.5 18.5 14 14 14C14 14 17.5 12 19 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
              <path d="M14 14V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-primary" />
              <circle cx="14" cy="7" r="2" className="fill-primary" />
            </svg>
            <span className="text-lg font-semibold tracking-tight text-primary-foreground">
              RecruitAI
            </span>
          </div>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-primary-foreground mb-4 text-balance leading-tight">
            Hire smarter,{" "}
            <br />
            not harder.
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-md">
            Join 500+ teams using AI to screen resumes, rank candidates, and schedule interviews automatically.
          </p>
        </div>
        <p className="text-primary-foreground/60 text-sm">
          &copy; 2026 RecruitAI. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div className="lg:hidden">
            <Link href="/">
              <RecruitLogo />
            </Link>
          </div>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
