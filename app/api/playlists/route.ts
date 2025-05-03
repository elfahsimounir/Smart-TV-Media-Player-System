import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeItems = searchParams.get("includeItems") === "true"

    const playlists = await db.playlist.findMany({
      include: {
        items: includeItems
          ? {
              include: {
                media: true,
              },
              orderBy: {
                order: "asc",
              },
            }
          : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(playlists, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error fetching playlists:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, mediaIds } = body

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json({ error: "At least one media item is required" }, { status: 400 })
    }

    // Create playlist with items
    const playlist = await db.playlist.create({
      data: {
        name,
        items: {
          create: mediaIds.map((mediaId, index) => ({
            mediaId,
            order: index,
          })),
        },
      },
    })

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("Error creating playlist:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
