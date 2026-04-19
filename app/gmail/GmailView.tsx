"use client"

import { useState, useEffect } from "react"

type Email = {
  id: string
  fromName: string
  from: string
  subject: string
  snippet: string
  date: string
  isRead: boolean
}

type EmailDetail = {
  id: string
  from: string
  to: string
  subject: string
  date: string
  body: string
  isHtml: boolean
}

const LABELS = [
  { id: "INBOX", label: "Inbox" },
  { id: "SENT", label: "Sent" },
  { id: "DRAFT", label: "Drafts" },
  { id: "TRASH", label: "Trash" },
]

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }
  return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
}

function Avatar({ name }: { name: string }) {
  const colors = ["#4285F4", "#EA4335", "#34A853", "#FBBC05", "#FF6D00", "#46BDC6"]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  )
}

export default function GmailView() {
  const [activeLabel, setActiveLabel] = useState("INBOX")
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EmailDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    fetch(`/api/emails?labelId=${activeLabel}`)
      .then((r) => r.json())
      .then((data) => {
        setEmails(data.emails ?? [])
        setLoading(false)
      })
  }, [activeLabel])

  const openEmail = async (email: Email) => {
    setLoadingDetail(true)
    const res = await fetch(`/api/emails/${email.id}`)
    const detail = await res.json()
    setSelected(detail)
    setLoadingDetail(false)
    setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)))
  }

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Labels sidebar */}
      <aside className="w-56 shrink-0 overflow-y-auto bg-white pt-2">
        <nav>
          {LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveLabel(id)}
              className={`flex w-full items-center gap-4 rounded-r-full px-6 py-2 text-sm transition-colors ${
                activeLabel === id
                  ? "bg-[#fce8e6] font-medium text-[#c5221f]"
                  : "text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Email list */}
      <div
        className={`flex flex-col border-l border-[#dadce0] ${
          selected ? "w-80 shrink-0" : "flex-1"
        }`}
      >
        <div className="border-b border-[#dadce0] px-6 py-3">
          <h2 className="text-sm font-medium text-[#202124]">
            {LABELS.find((l) => l.id === activeLabel)?.label}
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#5f6368]">
            Loading…
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {emails.map((email) => (
              <li key={email.id}>
                <button
                  onClick={() => openEmail(email)}
                  className={`flex w-full items-start gap-3 border-b border-[#f1f3f4] px-4 py-3 text-left transition-colors hover:bg-[#f1f3f4] ${
                    selected?.id === email.id ? "bg-[#fce8e6]" : ""
                  }`}
                >
                  <Avatar name={email.fromName || email.from} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          email.isRead ? "text-[#5f6368]" : "font-semibold text-[#202124]"
                        }`}
                      >
                        {email.fromName}
                      </span>
                      <span
                        className={`shrink-0 text-xs ${
                          email.isRead ? "text-[#5f6368]" : "font-semibold text-[#202124]"
                        }`}
                      >
                        {formatDate(email.date)}
                      </span>
                    </div>
                    <p
                      className={`truncate text-sm ${
                        email.isRead ? "text-[#5f6368]" : "font-medium text-[#202124]"
                      }`}
                    >
                      {email.subject}
                    </p>
                    <p className="truncate text-xs text-[#5f6368]">{email.snippet}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Email detail */}
      {selected && (
        <div className="flex flex-1 flex-col border-l border-[#dadce0]">
          <div className="flex items-center gap-4 border-b border-[#dadce0] px-6 py-3">
            <button
              onClick={() => setSelected(null)}
              className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]"
              title="Back"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <h2 className="truncate text-xl font-normal text-[#202124]">{selected.subject}</h2>
          </div>

          {loadingDetail ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[#5f6368]">
              Loading…
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="border-b border-[#dadce0] px-6 py-4">
                <div className="flex items-start gap-3">
                  <Avatar name={selected.from} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#202124]">{selected.from}</p>
                      <p className="shrink-0 text-xs text-[#5f6368]">{formatDate(selected.date)}</p>
                    </div>
                    <p className="text-xs text-[#5f6368]">to {selected.to}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {selected.isHtml ? (
                  <iframe
                    sandbox="allow-same-origin"
                    srcDoc={selected.body}
                    className="w-full border-0"
                    style={{ minHeight: "500px" }}
                    title="Email content"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[#202124]">
                    {selected.body}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
