"use client"

import { cn } from "@/lib/utils"

export function RecruitLogo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
       strokeLinejoin="round"
        className={cn( "lucide lucide-handshake h-5 w-5", className?.includes("sidebar")? "text-sidebar-foreground"
        : "text-foreground")}>
          <path d="m11 17 2 2a1 1 0 1 0 3-3"></path>
          <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 
          1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path><path d="m21 3 1 11h-2"></path><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path><path d="M3 4h8"></path></svg>
       {!iconOnly && (
        <span className={cn("text-lg font-semibold tracking-tight",
         className?.includes("sidebar")? "text-sidebar-foreground": "text-foreground")}>
          Recruit<span className="text-logoAccent">AI</span>
        </span>
      )}
    </div>
  )
}
