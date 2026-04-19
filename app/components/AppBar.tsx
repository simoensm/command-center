"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import Image from "next/image"

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
}

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .89-2 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)

export default function AppBar({ user }: { user?: User }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  const navItems = [
    { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
    { href: "/gmail", label: "Mail", Icon: MailIcon },
  ]

  return (
    <header className="flex h-16 items-center gap-4 border-b border-[#dadce0] bg-white px-4">
      {/* Logo */}
      <div className="flex w-56 shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8]">
          <span className="text-sm font-medium text-white">CC</span>
        </div>
        <span className="text-lg font-medium text-[#202124]">Command Center</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 items-center gap-1">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#e8f0fe] text-[#1a73e8]"
                  : "text-[#5f6368] hover:bg-[#f1f3f4]"
              }`}
            >
              <Icon />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User avatar + dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="h-9 w-9 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
          aria-label="Account menu"
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-medium text-white">
              {user?.name?.[0] ?? user?.email?.[0] ?? "U"}
            </div>
          )}
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-11 z-20 w-60 rounded-2xl border border-[#dadce0] bg-white shadow-lg">
              <div className="border-b border-[#dadce0] px-4 py-3">
                <p className="text-sm font-medium text-[#202124]">{user?.name}</p>
                <p className="text-xs text-[#5f6368]">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#202124] hover:bg-[#f1f3f4]"
                >
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
