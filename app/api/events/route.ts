import { auth } from "../../../auth"
import { google } from "googleapis"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const calendarId = searchParams.get("calendarId")
  const timeMin = searchParams.get("timeMin")
  const timeMax = searchParams.get("timeMax")

  if (!calendarId) {
    return NextResponse.json({ error: "calendarId is required" }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  const { data } = await calendar.events.list({
    calendarId,
    timeMin: timeMin ?? new Date().toISOString(),
    timeMax: timeMax ?? undefined,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  })

  return NextResponse.json(data.items ?? [])
}
