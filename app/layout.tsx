import type { Metadata } from "next"
import { Roboto } from "next/font/google"
import "./globals.css"
import { auth } from "../auth"
import AppBar from "./components/AppBar"

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "Command Center",
  description: "Your personal dashboard",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en" className="h-full">
      <body className={`${roboto.className} h-full bg-white text-[#202124] antialiased`}>
        {session && <AppBar user={session.user} />}
        {children}
      </body>
    </html>
  )
}
