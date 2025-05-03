import { db } from "@/lib/db"
import DeviceManagement from "@/components/admin/device-management"
import type { Metadata } from "next"

// Add dynamic configuration to ensure the page is always server-rendered with fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Device Management | TV Media Player Admin",
}

export default async function DevicesPage() {
  // Fetch devices and playlists
  const devices = await db.device.findMany({
    include: { playlist: true },
    orderBy: { name: "asc" },
  })

  const playlists = await db.playlist.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="container mx-auto py-6">
      <DeviceManagement initialDevices={devices} initialPlaylists={playlists} />
    </div>
  )
}
