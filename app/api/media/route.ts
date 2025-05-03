import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const mediaItems = await db.mediaItem.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(mediaItems, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error fetching media items:", error)
    return NextResponse.json({ error: "Failed to fetch media items" }, { status: 500 })
  }
}
