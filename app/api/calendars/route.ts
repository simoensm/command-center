import { auth } from "../../../auth"
import { google } from "googleapis"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  const { data } = await calendar.calendarList.list()

  return NextResponse.json(data.items ?? [])
}
