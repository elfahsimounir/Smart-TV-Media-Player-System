import { db } from "@/lib/db"
import AdminPageClient from "./client"
import type { Metadata } from "next"

// Add dynamic configuration to ensure the page is always server-rendered with fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Admin Dashboard | TV Media Player",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  }
}

export default async function AdminPage() {
  // Use fixed timestamps for consistent server-client rendering
  const now = Date.now()
  
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString()
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  // Fetch counts for dashboard
  const deviceCount = await db.device.count()
  const mediaCount = await db.mediaItem.count()
  const playlistCount = await db.playlist.count()

  // Fetch connected devices (seen in the last 5 minutes)
  const connectedDevices = await db.device.findMany({
    where: {
      lastSeen: {
        gte: new Date(fiveMinutesAgo),
      },
    },
    include: {
      playlist: true,
    },
    orderBy: {
      lastSeen: "desc",
    },
  })

  // Fetch recently disconnected devices (seen in the last 24 hours but not in the last 5 minutes)
  const recentlyDisconnectedDevices = await db.device.findMany({
    where: {
      lastSeen: {
        gte: new Date(twentyFourHoursAgo),
        lt: new Date(fiveMinutesAgo),
      },
    },
    include: {
      playlist: true,
    },
    orderBy: {
      lastSeen: "desc",
    },
    take: 5,
  })

  return (
    <AdminPageClient
      deviceCount={deviceCount}
      mediaCount={mediaCount}
      playlistCount={playlistCount}
      connectedDevices={connectedDevices}
      recentlyDisconnectedDevices={recentlyDisconnectedDevices}
    />
  )
}
