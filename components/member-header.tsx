"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Settings, Bell } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslation } from "@/lib/i18n/context"

export function MemberHeader() {
  const { t } = useTranslation()

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          <AvatarImage src="/placeholder.svg?height=56&width=56" alt="User avatar" />
          <AvatarFallback className="bg-primary/10 text-primary">AS</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ashva Member</h1>
          <p className="text-sm text-muted-foreground">Node Operator</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSelector />
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full" />
        </Button>
        <Button size="icon" variant="ghost">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
