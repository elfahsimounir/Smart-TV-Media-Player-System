import MediaManagement from "@/components/admin/media-management"
import type { Metadata } from "next"

// Add dynamic configuration to ensure the page is always server-rendered with fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Media Management | TV Media Player Admin",
}

export default function MediaPage() {
  return (
    <div className="container mx-auto py-6">
      {/* <h1 className="text-3xl font-bold mb-6">Media Management</h1> */}
      <MediaManagement />
    </div>
  )
}
