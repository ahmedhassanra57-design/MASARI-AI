"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Wallet } from "lucide-react"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <nav className={cn("flex items-center w-full", className)} {...props}>
        <Link href="/" className="flex items-center gap-2 font-semibold flex-shrink-0 mr-3 md:mr-4">
          <Wallet className="h-5 w-5 md:h-6 md:w-6" />
          <span className="hidden sm:inline text-sm md:text-base">MA$ARI-AI</span>
          <span className="sm:hidden text-sm font-bold">MA$</span>
        </Link>
        <div className="flex-1" />
      </nav>
    )
  }

  return (
    <nav className={cn("flex items-center w-full", className)} {...props}>
      {/* Logo - always visible */}
      <Link href="/" className="flex items-center gap-2 font-semibold flex-shrink-0 mr-3 md:mr-4">
        <Wallet className="h-5 w-5 md:h-6 md:w-6" />
        <span className="hidden sm:inline text-sm md:text-base">MA$ARI-AI</span>
        <span className="sm:hidden text-sm font-bold">MA$</span>
      </Link>
      
      {/* Scrollable navigation container */}
      <div className="flex-1 overflow-hidden nav-container">
        <div className="flex items-center space-x-1 md:space-x-4 overflow-x-auto nav-scroll scrollbar-none">
      <Link
        href="/"
        className={cn(
              "text-xs md:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-2 md:px-3 py-1.5 md:py-2 rounded-md flex-shrink-0 nav-item",
              pathname === "/" ? "text-primary bg-primary/10 active" : "text-muted-foreground",
        )}
      >
        Dashboard
      </Link>
      <Link
        href="/budgets"
        className={cn(
              "text-xs md:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-2 md:px-3 py-1.5 md:py-2 rounded-md flex-shrink-0 nav-item",
              pathname === "/budgets" ? "text-primary bg-primary/10 active" : "text-muted-foreground",
        )}
      >
        Budgets
      </Link>
      <Link
        href="/expenses"
        className={cn(
              "text-xs md:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-2 md:px-3 py-1.5 md:py-2 rounded-md flex-shrink-0 nav-item",
              pathname === "/expenses" ? "text-primary bg-primary/10 active" : "text-muted-foreground",
        )}
      >
        Expenses
      </Link>
      <Link
        href="/income"
        className={cn(
              "text-xs md:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-2 md:px-3 py-1.5 md:py-2 rounded-md flex-shrink-0 nav-item",
              pathname === "/income" ? "text-primary bg-primary/10 active" : "text-muted-foreground",
        )}
      >
        Income
      </Link>
      <Link
        href="/reports"
        className={cn(
              "text-xs md:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-2 md:px-3 py-1.5 md:py-2 rounded-md flex-shrink-0 nav-item",
              pathname === "/reports" ? "text-primary bg-primary/10 active" : "text-muted-foreground",
        )}
      >
        Reports
      </Link>
          <Link
            href="/receipts"
            className={cn(
              "text-xs md:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap px-2 md:px-3 py-1.5 md:py-2 rounded-md flex-shrink-0 nav-item",
              pathname === "/receipts" ? "text-primary bg-primary/10 active" : "text-muted-foreground",
            )}
          >
            Receipts
          </Link>
          {/* Add some padding at the end for better scrolling */}
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
    </nav>
  )
}
