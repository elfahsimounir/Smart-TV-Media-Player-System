import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const devices = await db.device.findMany({
      include: {
        playlist: true,
      },
    })
    return NextResponse.json(devices)
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, ipAddress, defaultUrl, playlistId } = body

    if (!name || !ipAddress) {
      return NextResponse.json({ error: "Name and IP address are required" }, { status: 400 })
    }

    // Handle the playlistId properly
    // If playlistId is "none" or empty, set it to null
    const finalPlaylistId = playlistId && playlistId !== "none" ? playlistId : null

    // Validate that the playlist exists if a playlistId is provided
    if (finalPlaylistId) {
      const playlist = await db.playlist.findUnique({
        where: { id: finalPlaylistId },
      })

      if (!playlist) {
        return NextResponse.json({ error: "Selected playlist does not exist" }, { status: 400 })
      }
    }

    const device = await db.device.create({
      data: {
        name,
        description,
        ipAddress,
        defaultUrl,
        playlistId: finalPlaylistId,
      },
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error creating device:", error)
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
  }
}
