import { auth } from "../../auth"
import { redirect } from "next/navigation"
import { google } from "googleapis"
import CalendarView from "./CalendarView"

export default async function CalendarPage() {
  const session = await auth()

  if (!session?.accessToken) {
    redirect("/")
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  const { data } = await calendar.calendarList.list()
  const calendars = data.items ?? []

  return <CalendarView calendars={calendars} />
}
