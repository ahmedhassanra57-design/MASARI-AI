import { MainNav } from "@/components/layout/main-nav"
import { UserNav } from "@/components/layout/user-nav"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MainNav />
      <div className="ml-auto flex items-center gap-4">
        <ModeToggle />
        <UserNav />
      </div>
    </header>
  )
}
