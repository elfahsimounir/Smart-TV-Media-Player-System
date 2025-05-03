import PlaylistManagement from "@/components/admin/playlist-management"
import type { Metadata } from "next"

// Add dynamic configuration to ensure the page is always server-rendered with fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Playlist Management | TV Media Player Admin",
}

export default function PlaylistsPage() {
  return (
    <div className="container mx-auto py-6">
      <PlaylistManagement />
    </div>
  )
}
