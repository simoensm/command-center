import { auth } from "../../../auth"
import { google } from "googleapis"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const labelId = searchParams.get("labelId") ?? "INBOX"

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })
  const gmail = google.gmail({ version: "v1", auth: oauth2Client })

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: [labelId],
    maxResults: 50,
  })

  const messages = listRes.data.messages ?? []

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      })

      const headers = detail.data.payload?.headers ?? []
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""

      const from = getHeader("From")
      const fromMatch = from.match(/^"?([^"<]+)"?\s*</)
      const fromName = fromMatch ? fromMatch[1].trim() : from.split("@")[0]

      return {
        id: detail.data.id,
        threadId: detail.data.threadId,
        from,
        fromName,
        subject: getHeader("Subject") || "(no subject)",
        snippet: detail.data.snippet ?? "",
        date: getHeader("Date"),
        isRead: !detail.data.labelIds?.includes("UNREAD"),
      }
    })
  )

  return NextResponse.json({ emails, nextPageToken: listRes.data.nextPageToken ?? null })
}
