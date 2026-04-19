import { auth } from "../../auth"
import { redirect } from "next/navigation"
import GmailView from "./GmailView"

export default async function GmailPage() {
  const session = await auth()
  if (!session?.accessToken) redirect("/")

  return <GmailView />
}
