import { db } from "@/lib/db"
import TVControlPanel from "@/components/admin/tv-control-panel"
import type { Metadata } from "next"

// Add dynamic configuration to ensure the page is always server-rendered with fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "TV Control | Media Player Admin",
}

export default async function TVControlPage({
  searchParams,
}: {
  searchParams: { deviceId?: string }
}) {
  // Fetch all devices
  const devices = await db.device.findMany({
    orderBy: {
      name: "asc",
    },
  })

  // Get the selected device ID from the query parameters - properly handle it as it might be an array
  const deviceIdParam = searchParams.deviceId
  const selectedDeviceId = typeof deviceIdParam === "string" ? deviceIdParam : ""

  return (
    <div className="container mx-auto py-6">
      <TVControlPanel devices={devices} initialSelectedDeviceId={selectedDeviceId} />
    </div>
  )
}
