import { auth } from "../../../../auth"
import { google } from "googleapis"
import { NextResponse } from "next/server"

type MimePart = {
  mimeType?: string | null
  body?: { data?: string | null } | null
  parts?: MimePart[] | null
}

function extractBody(payload: MimePart): { content: string; isHtml: boolean } {
  if (!payload) return { content: "", isHtml: false }

  if (payload.body?.data && !payload.parts) {
    const content = Buffer.from(payload.body.data, "base64").toString("utf-8")
    return { content, isHtml: payload.mimeType === "text/html" }
  }

  if (payload.parts) {
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html")
    if (htmlPart?.body?.data) {
      return {
        content: Buffer.from(htmlPart.body.data, "base64").toString("utf-8"),
        isHtml: true,
      }
    }
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain")
    if (textPart?.body?.data) {
      return {
        content: Buffer.from(textPart.body.data, "base64").toString("utf-8"),
        isHtml: false,
      }
    }
    for (const part of payload.parts) {
      const result = extractBody(part)
      if (result.content) return result
    }
  }

  return { content: "", isHtml: false }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })
  const gmail = google.gmail({ version: "v1", auth: oauth2Client })

  const detail = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  })

  const headers = detail.data.payload?.headers ?? []
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""

  const { content, isHtml } = extractBody(detail.data.payload as MimePart)

  // Mark as read
  if (detail.data.labelIds?.includes("UNREAD")) {
    await gmail.users.messages.modify({
      userId: "me",
      id,
      requestBody: { removeLabelIds: ["UNREAD"] },
    })
  }

  return NextResponse.json({
    id: detail.data.id,
    from: getHeader("From"),
    to: getHeader("To"),
    subject: getHeader("Subject") || "(no subject)",
    date: getHeader("Date"),
    body: content,
    isHtml,
  })
}
