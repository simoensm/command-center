"use client"

import { useState, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { calendar_v3 } from "googleapis"
import type { EventInput } from "@fullcalendar/core"

type GoogleCalendar = calendar_v3.Schema$CalendarListEntry

const FALLBACK_COLORS = [
  "#4285F4", "#EA4335", "#34A853", "#FBBC05",
  "#FF6D00", "#46BDC6", "#7986CB", "#33B679",
]

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
)

export default function CalendarView({ calendars }: { calendars: GoogleCalendar[] }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(calendars.map((c) => [c.id!, true]))
  )
  const [events, setEvents] = useState<EventInput[]>([])

  const colorFor = (index: number) => FALLBACK_COLORS[index % FALLBACK_COLORS.length]

  useEffect(() => {
    const fetchEvents = async () => {
      const now = new Date()
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString()

      const active = calendars.filter((c) => enabled[c.id!])
      const results = await Promise.all(
        active.map(async (cal, index) => {
          const res = await fetch(
            `/api/events?calendarId=${encodeURIComponent(cal.id!)}&timeMin=${timeMin}&timeMax=${timeMax}`
          )
          const items = await res.json()
          return items.map((event: calendar_v3.Schema$Event) => ({
            id: event.id,
            title: event.summary ?? "(no title)",
            start: event.start?.dateTime ?? event.start?.date,
            end: event.end?.dateTime ?? event.end?.date,
            allDay: !event.start?.dateTime,
            backgroundColor: cal.backgroundColor ?? colorFor(index),
            borderColor: cal.backgroundColor ?? colorFor(index),
          }))
        })
      )
      setEvents(results.flat())
    }

    fetchEvents()
  }, [enabled, calendars])

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 overflow-y-auto bg-white pt-4">
        <p className="mb-1 px-4 text-xs font-medium uppercase tracking-wider text-[#5f6368]">
          My calendars
        </p>
        <ul>
          {calendars.map((cal, index) => {
            const color = cal.backgroundColor ?? colorFor(index)
            const active = enabled[cal.id!]
            return (
              <li key={cal.id}>
                <button
                  onClick={() => setEnabled((prev) => ({ ...prev, [cal.id!]: !prev[cal.id!] }))}
                  className="flex w-full items-center gap-3 rounded-r-full px-4 py-1.5 text-left text-sm text-[#202124] transition-colors hover:bg-[#f1f3f4]"
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-white"
                    style={{
                      backgroundColor: active ? color : "transparent",
                      border: `2px solid ${color}`,
                    }}
                  >
                    {active && <CheckIcon />}
                  </span>
                  <span className="truncate">{cal.summary}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Calendar */}
      <main className="flex-1 overflow-auto border-l border-[#dadce0] p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          height="100%"
          nowIndicator
        />
      </main>
    </div>
  )
}
