"use client"

import { useState, useEffect, useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { calendar_v3 } from "googleapis"
import type { EventInput } from "@fullcalendar/core"
import SignOutButton from "./SignOutButton"

type GoogleCalendar = calendar_v3.Schema$CalendarListEntry

const CALENDAR_COLORS = [
  "#4285F4", "#EA4335", "#34A853", "#FBBC05",
  "#FF6D00", "#46BDC6", "#7986CB", "#33B679",
  "#E67C73", "#F6BF26", "#039BE5", "#616161",
]

export default function CalendarView({ calendars }: { calendars: GoogleCalendar[] }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(calendars.map((c) => [c.id!, true]))
  )
  const [events, setEvents] = useState<EventInput[]>([])
  const calendarRef = useRef<FullCalendar>(null)

  const colorFor = (index: number) => CALENDAR_COLORS[index % CALENDAR_COLORS.length]

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

  const toggleCalendar = (id: string) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            My Calendars
          </h2>
          <SignOutButton />
        </div>
        <ul className="space-y-1">
          {calendars.map((cal, index) => (
            <li key={cal.id}>
              <button
                onClick={() => toggleCalendar(cal.id!)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: enabled[cal.id!]
                      ? (cal.backgroundColor ?? colorFor(index))
                      : "#d1d5db",
                  }}
                />
                <span className={`truncate ${enabled[cal.id!] ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>
                  {cal.summary}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Calendar */}
      <main className="flex-1 overflow-auto p-4">
        <FullCalendar
          ref={calendarRef}
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
